use std::{
    ffi::{CStr, CString},
    ops::Deref,
};

use libc::{c_char, c_int, c_uint, c_void, free};

mod ffi {
    use libc::{c_char, c_int, c_uint};

    unsafe extern "C" {
        #[allow(non_snake_case)]
        pub fn pikchr(
            zText: *const c_char,
            zClass: *const c_char,
            mFlags: c_uint,
            pnWidth: *mut c_int,
            pnHeight: *mut c_int,
        ) -> *mut c_char;

    }

    pub const PIKCHR_PLAINTEXT_ERRORS: c_uint = 0x0001;
    pub const PIKCHR_DARK_MODE: c_uint = 0x0002;
}

#[derive(Debug, Default, Clone)]
pub struct Options {
    pub plaintext_errors: bool,
    pub dark_mode: bool,
}

impl From<Options> for c_uint {
    fn from(options: Options) -> Self {
        (if options.plaintext_errors {
            ffi::PIKCHR_PLAINTEXT_ERRORS
        } else {
            0
        }) | (if options.dark_mode {
            ffi::PIKCHR_DARK_MODE
        } else {
            0
        })
    }
}

impl Options {
    pub fn set_dark_mode(mut self, dark_mode: bool) -> Self {
        self.dark_mode = dark_mode;
        self
    }
}

pub struct Image {
    pub content: *const c_char,
    pub width: c_int,
    pub height: c_int,
}

impl Deref for Image {
    type Target = str;

    fn deref(&self) -> &Self::Target {
        unsafe { std::str::from_utf8_unchecked(std::ffi::CStr::from_ptr(self.content).to_bytes()) }
    }
}

impl Drop for Image {
    fn drop(&mut self) {
        if self.content.is_null() {
            return;
        }

        unsafe { free(self.content as *mut c_void) };
    }
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("unable to create C-compatible string: {0}")]
    CStringError(std::ffi::NulError),
    #[error("pikchr failed but returned no error")]
    NoError,
    #[error("pikchr rendering failed: {0}")]
    RenderingError(String),
}

impl Image {
    pub fn render(source: &str, class: Option<&str>, options: Options) -> Result<Self, Error> {
        let mut width: c_int = 0;
        let mut height: c_int = 0;

        let source = CString::new(source).map_err(Error::CStringError)?;

        let class = class
            .map(CString::new)
            .transpose()
            .map_err(Error::CStringError)?;

        let result: *mut c_char = unsafe {
            ffi::pikchr(
                source.as_ptr() as *const c_char,
                class
                    .map(|c| c.as_ptr() as *const c_char)
                    .unwrap_or(std::ptr::null()),
                options.into(),
                &mut width,
                &mut height,
            )
        };

        if width < 0 {
            let err = if result.is_null() {
                Error::NoError
            } else {
                let err = unsafe { CStr::from_ptr(result) };
                Error::RenderingError(String::from_utf8_lossy(err.to_bytes()).into_owned())
            };

            unsafe {
                free(result as *mut c_void);
            }

            Err(err)
        } else {
            Ok(Self {
                content: result,
                width,
                height,
            })
        }
    }
}
