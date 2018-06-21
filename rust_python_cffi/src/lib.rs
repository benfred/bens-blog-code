extern crate libc;
extern crate cpp_demangle;

use libc::c_char;
use std::ffi::CStr;
use std::ffi::{CString};
use std::ptr;

#[no_mangle]
pub extern "C" fn demangle(input: *const c_char,
                           output: *mut c_char,
                           output_size: u32) -> i32 {
    // Copy input into a rust string
    let mangled = unsafe { CStr::from_ptr(input).to_bytes() };

    // Get the demangled output
    let demangled = match cpp_demangle::Symbol::new(&mangled[..]) {
        Ok(sym) => sym.to_string(),
        Err(_e) => return -1
    };

    // Check to see if we have enough storage in the output to hold the result
    if demangled.len() >= output_size as usize {
        return -2;
    }

    // convert to a null terminated string
    let demangled = CString::new(demangled).unwrap();

    // copy output back to caller
    unsafe {
        ptr::copy_nonoverlapping(demangled.as_ptr(), output, output_size as usize);
    }

    0
}
