---
title: Linking against Python when Cross Compiling, Revisited
description: How to link against the pre-built Python for Windows libraries from a Linux host.
---

I have a windows executable, which uses [pybind11](https://github.com/pybind/pybind11) to embed a
Python interpreter. How can I compile it from a Linux host? I'm assuming you already have a working
cross-compiler, and while you could try cross-compile Python itself, I'd rather link against the
pre-built version to not have to worry about all the extra dependencies.

I've previously written a
[post about this same topic]({% link _posts/2023-07-03-python-cross-compiling.md %}), however
changes to how Python for Windows is packaged mean the method described there will stop working, and
the new method turns out to be a lot simpler.

# Using an existing Windows Install
Firstly, let's try just using an existing Window install, we'll worry about grabbing the files we
need later.

Our initial CMake file looks something like this.
```cmake
find_package(Python 3.14 COMPONENTS Development)
add_subdirectory(pybind11)

target_link_libraries(my_app PRIVATE
    pybind11::embed
    pybind11::lto
    pybind11::windows_extras
)
```

The first step is to remove `FindPython`. It really feels like it's designed around creating a
module, it's hard to coerce into finding a particular install (e.g. it will pick 64bit installs when
compiling for 32bit), and critically it will only find the host's install, it just doesn't work at
all when cross compiling. If we don't call it, pybind will for us, so we need to disable that too.

```cmake
set(PYBIND11_NOPYTHON True)
add_subdirectory(pybind11)
```

Next we point it at the files from the Windows install manually.

```cmake
target_include_directories(my_app PRIVATE "${WIN_PYTHON_DIR}/include")

file(GLOB _py_libs "${WIN_PYTHON_DIR}/libs/*.lib")
target_link_libraries(my_app PRIVATE ${_py_libs})
```

And just like that, we're done already, we can compile. If you're just building a Python module,
this should be enough, but since we're building an embedded interpreter we need a couple more files.
On the Python website, one of the extra downloads for each version is `Windows embeddable package` -
we can just download this, and stick it in our binaries folder. We'll automate this later.

# Without Using Windows (or Wine)
So now let's try grab these files without using Windows at all. This is where the major changes
compared to my previous method are.

Exploring the Python ftp a little, we can find where the Windows files are downloaded from. These
files exist for all versions from 3.11 upwards - if you want to link against an older version of
Python for some reason, you'll have to use
[my previous method]({% link _posts/2023-07-03-python-cross-compiling.md %}) instead.

The main install is just:
```
https://www.python.org/ftp/python/<version>/python-<version>-<arch>.zip
```

If you want a version with debug symbols (perhaps for your debug builds), they're in:
```
https://www.python.org/ftp/python/<version>/python-<version>-test-<arch>.zip
```
This also includes a bunch of test modules (hence the name), but you can just ignore them.

If you want free-threaded builds, they're in:
```
https://www.python.org/ftp/python/<version>/python-<version>t-<arch>.zip
```

And finally, the embedded package is in:
```
https://www.python.org/ftp/python/<version>/python-<version>-embeddable-<arch>.zip
```

Since all these files are all just zips, CMake `FetchContent` can handle them all for you, with no
need for external scripts or dependencies. A lot easier than my previous method.

## Custom embeddable package
There's no debug or free-threaded embeddable packages, if you want these you'll have to create your
own. You can even do this for the main install, you don't actually need to download the embeddable
package.

Most of the embeddable package is just a bunch of `.dll`s/`.pyd`s. You can grab them from your
install:
- `python3.dll`
- `python314.dll`
- `DLLs/*.dll`
- `DLLs/*.pyd`

If you're using the test package, you probably also want to grab all the `.pdb`s.

The next important thing is the `python314.zip`. This zip holds the compiled bytecode of the entire
standard library. You *could* create this yourself using
[`PyZipFile`](https://docs.python.org/3/library/zipfile.html#pyzipfile-objects) - but Python
bytecode isn't stable across major versions, and compiling it with the exact same version adds a
bunch of complexity to the build. Another option is just to grab it from the base embeddable
package, it's bytecode, it's not binary specific. Or you could just copy the `Lib` folder as-is, it
won't be precompiled, but it's the same sources.

The last file you may be interested in is the `python314._pth`.
[`._pth` files](https://docs.python.org/3/library/sys_path_init.html#pth-files) set up a default
`sys.path`, you might not even need one. If you do, they're just a couple lines of text, so its easy
to make your own.

# Final CMake File
If we put it all together, we get the following. I'm skipping over the free threaded and debug
builds, it's relatively simple to swap them in (even based on build type).

```cmake
set(VERSION "3.14.3")
set(ARCH "amd64")

# Download the relevant zips
include(FetchContent)
FetchContent_Declare(
    _python_main
    URL https://www.python.org/ftp/python/${VERSION}/python-${VERSION}-${ARCH}.zip
    # Maybe add URL_HASH
)
FetchContent_Declare(
    _python_embeddable
    URL https://www.python.org/ftp/python/${VERSION}/python-${VERSION}-embeddable-${ARCH}.zip
)
FetchContent_MakeAvailable(_python_main _python_embeddable)

# Link against the downloaded version
target_include_directories(my_app PRIVATE "${_python_main_SOURCE_DIR}/include")

file(GLOB _py_libs "${_python_main_SOURCE_DIR}/libs/*.lib")
target_link_libraries(my_app PRIVATE ${_py_libs})

# Make an install grab all the same files as an embeddable build
file(GLOB _version_dll "${_python_main_SOURCE_DIR}/python3?*.dll")
file(GLOB _dlls "${_python_main_SOURCE_DIR}/DLLs/*.dll")
file(GLOB _pyds "${_python_main_SOURCE_DIR}/DLLs/*.pyd")
file(GLOB _bytecode_zip "${_python_embeddable_SOURCE_DIR}/python*.zip")
install(
    FILES
        ${_python_main_SOURCE_DIR}/python3.dll
        ${_version_dll}
        ${_dlls}
        ${_pyds}
        ${_bytecode_zip}
    DESTINATION "my_app"
)
# Alternatively, to use the Lib folder instead of the bytecode zip:
# install(
#     DIRECTORY "${_python_main_SOURCE_DIR}/Lib"
#     DESTINATION "my_app"
# )
cmake_path(GET _version_dll STEM _version_stem)
set(_pth_contents "${_version_stem}.zip\n.\n")
install(CODE "file(WRITE $<INSTALL_PREFIX>/my_app/${_version_stem}._pth \"${_pth_contents}\")")

# Link with pybind
set(PYBIND11_NOPYTHON True)
add_subdirectory(pybind11)

target_link_libraries(my_app PRIVATE
    pybind11::embed
    pybind11::lto
    pybind11::windows_extras
)
```
