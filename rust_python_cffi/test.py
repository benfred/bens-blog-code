from cffi import FFI

ffi = FFI()
ffi.cdef("int demangle(const char *, char *, int);")

lib = ffi.dlopen("./target/debug/deps/libc_cpp_demangle.dylib")

def demangle(mangled, result_size=128):
    result = ffi.new("char[%i]" % result_size)
    error_code = lib.demangle(mangled, result, result_size)

    if error_code == 0:
        return ffi.string(result)
    else:
        raise ValueError("failed to demangle (error_code=%i)" % error_code)

print(demangle(b"_ZN7mangled3fooEd"))

