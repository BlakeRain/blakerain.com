use time::{format_description::well_known::Rfc2822, OffsetDateTime};

fn main() {
    println!("cargo:rerun-if-changed=content");

    println!(
        "cargo:rustc-env=BUILD_TIME={}",
        OffsetDateTime::now_utc()
            .format(&Rfc2822)
            .expect("time format")
    );
}
