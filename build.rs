fn main() {
    let profile = std::env::var("PROFILE").expect("PROFILE");
    println!("cargo:rustc-env=CARGO_PROFILE={}", profile);
    cc::Build::new().file("cbits/pikchr.c").compile("pikchr");
}
