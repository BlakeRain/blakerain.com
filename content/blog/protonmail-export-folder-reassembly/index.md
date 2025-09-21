---
title: Reassembling Folders from ProtonMail's Export Tool
tags:
  - email
  - protonmail
date: 2025-09-21T19:34:18.193Z
---

This weekend I had to migrate an email account from [ProtonMail] to a mail server that I host.
Proton provide an [export tool] that exports mail from a ProtonMail account to a local directory.
Unfortunately, the folder structure is not preserved in the process, so I made a [terrible tool] to
reassemble the folders.

<!--more-->

I've never transferred mail _from_ ProtonMail before: I've only ever migrated _to_ ProtonMail. So I
was somewhat unprepared for how annoying the process ended up being. Migrating _to_ ProtonMail is
quite painless, since ProtonMail includes a feature to fetch mail from an external IMAP server
(called [EasySwitch]), so I was expecting a similar level of convenience when going the other way.


> [!NOTE] Better ways may exist
> I would usually use [fetchmail] to get email from one IMAP account into another, but ProtonMail
> does not support IMAP access, so that was not an option. There may be other options for exporting
> from ProtonMail, but my cursory search did not turn up anything useful.

To allow exporting mail, ProtonMail's [documentation] seems to only offer a single option: using the
[export tool]. This is a command-line tool that you run locally, which connects to your ProtonMail
account and downloads all your mail to a local directory.

When the ProtonMail export tool runs, it creates a directory that contains a series of `.eml` and
`.json` files: one for each message in the mail account. The `.eml` file is a standard MIME email
file, while the `.json` file contains metadata about the message. All the messages are dumped into a
single directory, so the folder structure is lost. This is quite inconvenient, so I decided to write
a small script to attempt to reassemble the folder structure.

Looking at the `.json` files, I found that each contains a `LabelIDs` field, giving an array of
strings:

```json
{
  "Version": 1,
  "Payload": {
    "LabelIDs": [
        "1",
        "5",
        "9",
    ],
    ...
  }
}
```

I was not sure what the numbers meant, and looking in other `.json` files I found that other IDs
than numbers are being used:

```json
{
  "Version": 1,
  "Payload": {
    "LabelIDs": [
        "1",
        "5",
        "eWVzIEknbSBmYWtpbmcgSURzLCBhbmQgdGhpcyBpcyBqdXN0IHBhZGRpbmcK",
    ],
    ...
  }
}
```

At first I thought that these longer IDs might correspond to a base-64 encoding of something, but it
was just binary data that meant nothing to me. I then compared the IDs in the `LabelIDs` array to
the IDs used in the ProtonMail web interface. Visiting some of the folders in the web interface I
found the URL changes to match the ID in the `LabelIDs` array:

```
https://mail.proton.me/u/2/eWVzIEknbSBmYWtpbmcgSURzLCBhbmQgdGhpcyBpcyBqdXN0IHBhZGRpbmcK
```

After writing some Python code to load all the `.json` files, I found that one file did not contain
data that matched all the others. Turns out this file is called `labels.json` 😒, and it contains a
mapping from IDs to folder names. As this file was hidden among the many `.json` files, I had not
noticed it until my tool chocked on it.

```json
{
  "Version": 1,
  "Payload": [
    {
      "Path": "Inbox",
      "ID": "0",
      "ParentID": "",
      "Name": "Inbox",
      "Color": "#8080FF",
      "Type": 3
    },
    {
      "Path": "Drafts",
      "ID": "8",
      "ParentID": "",
      "Name": "Drafts",
      "Color": "#8080FF",
      "Type": 3
    },
    {
      "Path": "All Drafts",
      "ID": "1",
      "ParentID": "",
      "Name": "All Drafts",
      "Color": "#8080FF",
      "Type": 1
    },
    ...
  ]
}
```

With this mapping in hand, I was able to write a [terrible tool] that attempts to reassemble the
folder structure of a ProtonMail export. The tool reads the `labels.json` file and creates folders
for certain labels, then links the `.eml` files into the appropriate folders based on their
`LabelIDs`.

By default the tool doesn't create folders for labels that have only digits as their IDs, since
these seem to be system labels like "Inbox", "Sent", "Drafts", etc. You can override this via the
folders configuration file. The tool creates folders for all labels that have a non-numeric IDs,
which seem to correspond to user-created folders. However, these can be excluded using the folder
configuration file.

The tool takes two arguments: the path to the ProtonMail export directory (where all the `.eml` and
`.json` files are), and the path to a directory in which to create the reassembled folders:

```
usage: proton-reassemble.py [-h] [--folders-config FOLDERS_CONFIG] input_dir output_dir

Reassemble emails from ProtonMail export based on labels.

positional arguments:
  input_dir             Directory containing the ProtonMail export.
  output_dir            Directory to store reassembled emails.

options:
  -h, --help            show this help message and exit
  --folders-config FOLDERS_CONFIG
                        YAML file specifying which folders to create.
```

The tool also takes an optional `--folders-config` argument, which is the path to a YAML file that
can be used to specify which folders to create or exclude. The format of the YAML file is as follows:

```yaml
# List some numerical labels to create folders for.
create:
  - "0"   # Corresponds to "Inbox"
  - "7"   # Corresponds to "Sent"

# Exclude some user-created folders we don't want.
exclude:
  - "example.com (imported)"
  - "vastly unhelpful folder name"
```

The tool creates hard links to the `.eml` files in the appropriate folders, so you can delete the
original export directory after running the tool if you want to save space.

Once the folders are reassembled, you can use your preferred method to import the mail into your
mail server. I've used `mbsync` in the past to sync mail into an IMAP server, but the owner of the
account I was helping this time wanted to use Thunderbird to import their mail. Dragging and
dropping the files into the Thunderbird message list accepted the emails and uploaded them to the
mail server. All this worked quite nicely, and the user was able to recreate all their mail folders.
Well, until they exceeded their mailbox quota 🙄

[export tool]: https://github.com/ProtonMail/proton-mail-export
[ProtonMail]: https://proton.me/mail
[EasySwitch]: https://proton.me/support/easy-switch
[documentation]: https://proton.me/support/proton-mail-export-tool
[terrible tool]: https://gist.github.com/BlakeRain/3da733c65dfa194fc70c8978b7e514f7
[fetchmail]: https://www.fetchmail.info/
