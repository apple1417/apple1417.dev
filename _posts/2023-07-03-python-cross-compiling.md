---
title: Linking against Python when Cross Compiling
description: How to get all the files out of the Python for Windows installer without running it.
---

So I have a Windows executable (or rather a dll), which uses
[pybind11](https://github.com/pybind/pybind11) to embed a python interpreter. How can I compile this
from a Linux host? Without just compiling CPython from source, so we don't need to worry about
everything it depends on.

To start with, I previously wrote about how I got a project cross compiling, and how I managed to
debug it under proton, [which you can read here]({% link _posts/2023-05-18-debugging-proton.md %}).

# Using a Windows Install
The Python installer on Windows downloads everything we need to make native builds. To actually run
your application, you also need to separately download the "Windows Embeddable Package", and put it
somewhere your executable can find it, so it can load all the separate libraries. At a minimum, you
need `python3.dll`, `python311.dll`, and `python311.zip`, the rest are only required for specific
imports.

So as a first step, given a complete Windows install, can we get it cross compiling? Yes, it's
actually quite easy.

Our initial cmake file looks something like this.
```cmake
find_package(Python 3.11 COMPONENTS Development)
add_subdirectory(pybind11)

target_link_libraries(my_app PRIVATE
    pybind11::embed
    pybind11::lto
    pybind11::windows_extras
)
```

The first step is to remove `FindPython`. It really feels like it's designed around creating a
module, it's hard to coerce into finding a particular install (e.g. it will pick 64bit installs when
compiling for 32bit), and it will only find the host's install, it just doesn't work at all when
cross compiling. If we don't call it, pybind will for us, so we need to disable that too.

```cmake
set(PYBIND11_NOPYTHON True)
add_subdirectory(pybind11)
```
Next we point it at the files from the Windows install manually - taking care to switch between
debug/release libraries as required.

```cmake
target_include_directories(my_app PRIVATE "${WIN_PYTHON_DIR}/include")

file(GLOB py_libs "${WIN_PYTHON_DIR}/libs/*.lib")
foreach(lib ${py_libs})
    if ("${lib}" MATCHES "_d.lib$")
        target_link_libraries(my_app PRIVATE "$<$<CONFIG:DEBUG>:${lib}>")
    else()
        target_link_libraries(my_app PRIVATE "$<$<NOT:$<CONFIG:DEBUG>>:${lib}>")
    endif()
endforeach()
```

And just like that, we're done already, we can compile.

# Without Using Windows (or Wine)
So all we actually need is these files. How can we get them without needing to transfer them from a
Windows machine, or needing to install Python in a Wine prefix?

Since we know the Windows installer gets all these files, that's where I started looking. Extracting
it leaves 6 files, a dll, the png displayed on the left side of the installer, and 4 xml config
files. Poking through these, I found a lot of references to the python ftp server. So let's take a
look there.

Under `https://www.python.org/ftp/python/<version>/<arch>/`, there are a bunch of msi files. Seems
the main installer defers to these based on which features are selected. Some of these, such as
`path.msi`, only seem to contain a bunch of commands, while others contain actual files. Guess
what's in `dev.msi` and `dev_d.msi`? Exactly what we need.

The next problem is extracting them properly. So far, I'd been using 7zip to view inside the msis,
but it doesn't parse the file name quite right, what it lists as `include_abstract.h` should
actually be `include/abstract.h`. Luckily, there's an alternative, `msiextract` (part of msitools),
which can do this properly for us.

```sh
URL=https://www.python.org/ftp/python/3.11.4/amd64
wget $URL/dev.msi $URL/dev_d.msi
msiextract -C py_dev dev.msi dev_d.msi
```

# Debug Builds
There's one thing I've kind of glossed over so far. I previously mentioned you need to put the
Windows Embeddable Package somewhere your application can find it. This is true - *as long as you're
running a release build*. Debug builds expect `_d` versions. You can rename `python311.zip` to
`python311_d.zip` perfectly fine, it only contains python bytecode. But to get `python3_d.dll` and
`python311_d.dll` (and the pdbs), you'd normally copy them from your Windows install folder.

So how do we get these files without Windows? Same idea as the libraries, except this time we're
looking at `core`. `core.msi` and `core_pdb.msi` contain the release files, and `core_d.msi`
contains the debug files.

Extracting these with 7zip gets you the following files (or their `_d` versions):
```
python.dll
python.pdb
python_stable.dll
```

Not quite what we expected. Turns out this is another artifact of 7zip, it seems the installer
renames `python_stable` to `python3` and `python` to `python311`. Again, extracting with
`msiextract` handles it properly.

You can then drop these files into your app folder to run the debug version properly.

# Summary
You can download and extract all files needed for python development with the following commands.
```bash
VERSION=3.11.4
ARCH=amd64

EMBED_URL=https://www.python.org/ftp/python/$VERSION/python-$VERSION-embed-$ARCH.zip
MSI_URL=https://www.python.org/ftp/python/$VERSION/$ARCH
wget $EMBED_URL $MSI_URL/dev.msi $MSI_URL/dev_d.msi $MSI_URL/core_d.msi

msiextract -C dev dev.msi dev_d.msi
msiextract -C app core_d.msi
unzip python-$VERSION-embed-$ARCH.zip -d app

zip_name=$(find app -type f -name "python3*.zip")
cp $zip_name ${zip_name%.*}_d.zip
```

When compiling, add `dev/include` as an include dir, and `dev/libs/*.lib` as libraries, taking care
to link debug/release versions as needed.

To run your app, you need to copy at least `app/python3.dll`, `app/python311.dll`, and
`app/python311.zip` to the same dir as it's executable. In debug mode, you need to copy the `_d`
versions instead (and you probably also want the pdbs). You can change where you can put these if
you mess with the
[dll search path](https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-adddlldirectory)
and the
[sys.path initialization](https://docs.python.org/3/library/sys_path_init.html).
