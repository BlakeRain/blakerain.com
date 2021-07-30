const BaseAdapter = require("ghost-storage-base");
const AWS = require("aws-sdk");
const path = require("path");
const fs = require("fs");

const readFileAsync = (fp) => {
  return new Promise((resolve, reject) => {
    return fs.readFile(fp, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const stripLeadingSlash = (s) => {
  return s.indexOf("/") === 0 ? s.substring(1) : s;
};

const stripTrailingSlash = (s) => {
  return s.indexOf("/") === s.length - 1 ? s.substring(0, s.length - 2) : s;
};

class S3Adapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);

    const { accessKeyId, secretAccessKey, region, bucket, prefix } = config;

    this.settings = {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region,
      bucket: bucket,
      prefix: prefix,
    };

    this.host = "https://s3";
    if (this.settings.region !== "us-east-1") {
      this.host += "-" + this.settings.region;
    }

    this.host += ".amazonaws.com/" + this.settings.bucket;

    this.s3 = new AWS.S3({
      bucket: this.settings.bucket,
      region: this.settings.region,
      signatureVersion: "v4",
      s3ForcePathStyle: false,
      credentials: new AWS.Credentials(
        this.settings.accessKeyId,
        this.settings.secretAccessKey
      ),
    });
  }

  exists(fileName, targetDir) {
    const dir = targetDir || this.getTargetDir(this.settings.prefix);
    return new Promise((resolve, reject) => {
      this.s3.getObject(
        {
          Bucket: this.settings.bucket,
          Key: stripLeadingSlash(path.join(targetDir, fileName)),
        },
        (err) => {
          console.error("Encountered error calling S3:", err);
          if (err) {
            resolve(false);
          } else {
            resolve(true);
          }
        }
      );
    });
  }

  save(image, targetDir) {
    const dir = targetDir || this.getTargetDir(this.settings.prefix);
    return new Promise((resolve, reject) => {
      Promise.all([this.getUniqueFileName(image, dir), readFileAsync(image.path)])
        .then(([fileName, file]) => {
          this.s3.putObject(
            {
              ACL: "public-read",
              Body: file,
              Bucket: this.settings.bucket,
              CacheControl: `max-age=${30 * 24 * 60 * 60}`,
              ContentType: image.type,
              Key: stripLeadingSlash(fileName),
            },
            (err, data) => {
              if (err) {
                console.error("Failed to put S3 object:", err);
                reject(err);
              } else {
                console.log(`Wrote S3 object for image '${image.path}': '${fileName}'`);
                resolve(`${this.host}${fileName}`);
              }
            }
          );
        })
        .catch((err) => {
          console.error("Failed to resolve unique file-name or read file:", err);
          reject(err);
        });
    });
  }

  serve() {
    return (req, res, next) => {
      const path = stripLeadingSlash(stripTrailingSlash(this.settings.prefix) + req.path);
      console.log("Serving AWS S3 object:", req.path);
      console.log("Resolving to:", path);
      this.s3
        .getObject({
          Bucket: this.settings.bucket,
          Key: path,
        })
        .on("httpHeaders", (statusCode, headers, response) => {
          res.set(headers);
        })
        .createReadStream()
        .on("error", (err) => {
          console.error("Error getting object from S3:", err);
          res.status(404);
          next(err);
        })
        .pipe(res);
    };
  }

  delete(fileName, targetDir) {
    console.log(`Attempt to delete '${fileName} from ${targetDir}'`);
  }

  read(options) {
    return new Promise((resolve, reject) => {
      let path = stripLeadingSlash(stripTrailingSlash(options.path || ""));
      console.log("Reading S3 object:", path);

      if (!path.startsWith(this.host)) {
        console.error(`Path does not start with '${this.host}'`);
        reject(new Error(path + " is not stored in S3"));
      }

      path = path.substring(this.host.length);
      this.s3.getObject(
        {
          Bucket: this.settings.bucket,
          Key: stripLeadingSlash(path),
        },
        (err, data) => {
          if (err) {
            console.error("Error reading object from S3:", err);
            reject(err);
          } else {
            resolve(data.Body);
          }
        }
      );
    });
  }
}

module.exports = S3Adapter;
