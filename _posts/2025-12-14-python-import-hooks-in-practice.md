---
title: Python Import Hooks in Practice
description: An introduction to import hooks, and a few things I've found them useful for.
---

Python allows you to write Import Hooks to customize how the import system works. The official docs
are quite information dense however, and since there usually isn't much reason to mess with them,
there aren't many simpler examples out there. In this post I'll show you how to get started, and
show off a few cases I had a use for them.

As a bit of background, all the use cases I'll be discussing come from the legacy compat wrapper
of the [Borderlands 2/TPS Python Mod Manager](https://github.com/bl-sdk/willow2-mod-manager/). For
reasons I won't go into, there was a major update with many breaking changes, and the goal was to
get all old mods running under the new version without needing them to be updated. This context does
heavily affect the viability of some of these use cases, as we'll see later. I'm going to give
examples you can run locally though, all tested in Python 3.13.

I also have a [previous post]({% link _posts/2024-06-08-python-import-hook-aliasing.md %}) about
using import hooks to create module aliases, to allow importing them under another name. It is not
required reading, I'll be going over the basics again. If you're interested in the import system,
it does dive into some other details not covered here.

# Your first import hook
So lets get started: how do you write an import hook. The relevant docs are the
[import system](https://docs.python.org/3/reference/import.html) and
[`importlib`](https://docs.python.org/3/library/importlib.html). As I mentioned at the start of the
post, these are very information dense. It's best to keep them open, you'll probably want to refer
back to them a lot.

There are two types of import hook: a meta path finder, and a path entry finder. I haven't used path
entry finders, so this post won't have have any info on them. I *think* the difference is path
finders specifically relate to real files on disk, while meta path finders are an earlier type of
hook. From this point onwards, anywhere this post talks about an import hook, I mean a meta path
finder.

The simplest import hook looks like the following:
```py
import sys
from collections.abc import Sequence
from importlib.machinery import ModuleSpec
from types import ModuleType

class LoggingMetaPathFinder:
    @classmethod
    def find_spec(
        cls,
        fullname: str,
        path: Sequence[str] | None = None,
        target: ModuleType | None = None,
    ) -> ModuleSpec | None:
        print(fullname, path, target)
        return None
```

All meta path finders go into the `sys.meta_path` list. When trying to import something, each one's
tried in sequence, stopping when the first returns a module spec - returning None means "I don't
know how to find it".

Lets try it out.
```py
>>> sys.meta_path.insert(0, LoggingMetaPathFinder)
>>> import importlib
>>> import xml.etree.ElementTree as ET
xml None None
xml.etree ['/usr/lib/python3.13/xml'] None
xml.etree.ElementTree ['/usr/lib/python3.13/xml/etree'] None
xml.etree.ElementPath ['/usr/lib/python3.13/xml/etree'] None
_elementtree None None
pyexpat None None
```

The first thing to note here is that modules which have already been imported do not go through
import hooks. I find this is a slightly more well known fact, the import statement first does a
lookup in `sys.modules`. If you just want to add some fake names, which don't line up with what's on
disk, messing with `sys.modules` might be all you need - see also my
[previous post]({% link _posts/2024-06-08-python-import-hook-aliasing.md %}).

When we come to a fresh import, we can see how Python always has to import the top level modules
first. This is somewhat intuitive again, if the `xml` module could not be found, it would stop
there. We then also see a few extra imports at the end, triggered by the contents of `ElementTree`
specifically - in this case neither of the parent modules had uncached imports of their own.

So what do each of these args actually mean. As you've probably already guessed, `fullname` is the
full name of the module being imported.

`path` is a little more interesting. It's `None` when doing a top level import, otherwise it's a
sequence of strings the import system may look for child modules. In normal usage, it's always a
list of length 1, but it can be other types or different lengths when you start customizing things.
Each import hook decides how it parses these paths itself - typically they're treated as files, but
you could treat it as a url for example. The arg actually comes from `parent_module.__path__`, so
you could imagine your hook also setting that to include the url in the first place.

The last argument, `target` has been `None` in every example so far. It's relevant when it comes to
reloading modules - it's passed the old module. I don't think there's any default logic using it,
but can certainly imagine how it might be useful in a custom import hook.

```py
>>> _ = importlib.reload(ET)
xml.etree.ElementTree ['/usr/lib/python3.13/xml/etree'] <module 'xml.etree.ElementTree' from '/usr/lib/python3.13/xml/etree/ElementTree.py'>
```

The last question then is what's this `ModuleSpec` we're supposed to return? From the type hint,
obviously it's supposed to be an `importlib.machinery.ModuleSpec` instance, but what's it supposed
to have on it? My answer is, honestly, don't worry about it. `importlib.util` has two helpers,
`spec_from_loader` and `spec_from_file_location`, which can create it for you. You can mostly treat
it as an opaque type.

# Demo Import Hook
Every import hook really starts the same way: you do some form of matching on the arguments to
decide if this is a module you understand. In the mod manager, I did this by walking
`inspect.frame()` to find the importing module, and then just using a big
`match importing_module_name, fullname:` statement. This is ultimately going to be very specific to
your use case.

The interesting part of using import hooks is really in how you construct the module spec. To
facilitate showing that off better, I'm going to use this import hook in the following examples:
```py
import sys
from collections.abc import Callable, Sequence
from importlib.machinery import ModuleSpec
from types import ModuleType

next_module_spec: Callable[[str], ModuleSpec] | None = None

class DemoMetaPathFinder:
    @classmethod
    def find_spec(
        cls,
        fullname: str,
        path: Sequence[str] | None = None,
        target: ModuleType | None = None,
    ) -> ModuleSpec | None:
        if fullname.startswith("demo"):
            return next_module_spec(fullname)
        return None

# Append so it only applies to otherwise failed lookups
sys.meta_path.append(DemoMetaPathFinder)
```

This lets us more easily add a custom module spec to new imports while messing around in the REPL.

# Importing from a different path
So normally the import hierarchy is strongly tied to the filesystem. What if we wanted to break
this, and import a file from a different arbitrary path? The original motivation for this case was
the following scenario:
```
MyMod
|-- __init__.py
`-- dist
    `-- semver.py
```
`MyMod.py`:
```py
import site
site.addsitedir("Mods/MyMod/dist")
import semver
```

The Mod Manager isn't well integrated with standard PyPI packages, so it's somewhat common practice
to vendor dependencies. But one of the breaking changed broke this relative path - how can we make
the import still work without editing the code?

Now this specific case is simple enough we could solve it a few other ways. I could just have also
added the correct path, knowing that it would do nothing if it wasn't installed, or I could mess
with `sys.modules`. Really, I mostly just used an import hook because I already had one.

If we're going to use an import hook anyway, this is the perfect case for
`importlib.util.spec_from_file_location()`. It creates a module spec just like importing a from a
normal source file - but with no requirements on where that file is located with respect to anything
else.

```py
>>> from importlib.util import spec_from_file_location
>>> next_module_spec = lambda _: spec_from_file_location("demo_json", "/usr/lib/python3.13/json/__init__.py")
>>> import demo_json
>>> demo_json
<module 'demo_json' from '/usr/lib/python3.13/json/__init__.py'>
>>> demo_json.dumps({"hi": 1})
'{"hi": 1}'
```

Interestingly, the module name you pass can be essentially arbitrary. However, this might prevent
accessing nested modules.

```py
>>> next_module_spec = lambda _: spec_from_file_location("fake.fake with spaces.fake", "/usr/lib/python3.13/json/__init__.py")
>>> import demo_json2
>>> demo_json2
<module 'fake.fake with spaces.fake' from '/usr/lib/python3.13/json/__init__.py'>
>>> from demo_json import nested
>>> from demo_json2 import nested2
Traceback (most recent call last):
  File "<python-input-10>", line 1, in <module>
    from demo_json2 import nested2
ImportError: cannot import name 'nested2' from 'fake.fake with spaces.fake' (/usr/lib/python3.13/json/__init__.py)
```

Now lets try something more advanced.

```py
from importlib.util import spec_from_file_location

def next_module_spec(fullname: str) -> ModuleSpec:
    path = "/usr/lib/python3.13/encodings/" + fullname.removeprefix("demo_") + ".py"
    return spec_from_file_location(fullname, path)
```
```py
>>> import demo_utf_8
>>> demo_utf_8.encode("🎉")
(b'\xf0\x9f\x8e\x89', 1)
```

You could imagine this logic getting quite complex.

So far we've kind of been looking at the output - we know what path we want, how do we tell that to
the import system. Sometimes you might be interested in the input - given a module name, where would
it normally be imported from. You might then apply transformations to that path. You can get this
info via `importlib.machinery.PathFinder.find_spec()`, which implements the default import logic.

```py
>>> from importlib.machinery import PathFinder
>>> spec = PathFinder.find_spec("xml", None, None)
>>> spec.origin
'/usr/lib/python3.13/xml/__init__.py'
>>> spec.submodule_search_locations
['/usr/lib/python3.13/xml']
```

# Importing from a string
This example was motivated by a very similar case to the previous one.

```py
import site
site.addsitedir("Mods/MyMod/dist")
import requests

try:
    response = requests.get(f"https://api.github.com/repos/{repository}/releases", timeout=30)
    check_updates_available(response)
except Exception:
    ...
```

Unfortunately, this mod shipped a very old version of requests, which ran into several issues trying
to run in a far newer version of Python than it was made for. But it was only ever used in this one
spot. Couldn't we just fake this one call, what if we pretended the entire source file was just:

```py
def get(url: str, timeout: int) -> str:
    raise NotImplementedError
```
<small>
The mod's author agreed with breaking the update check if it got it working on new versions.
</small>

To tackle this one, we need to start learning about loaders. A loader is what, given a module spec,
actually loads the module. All loaders look like the following:

```py
from importlib.machinery import ModuleSpec
from types import ModuleType

class Loader:
    def create_module(self, spec: ModuleSpec) -> types.ModuleType | None:
        pass
    def exec_module(self, module: types.ModuleType) -> None:
        pass
```

We're not going to worry about the exact semantics of this class too much - once again `importlib`
implements a number of helper classes we're going to use instead. I'm showing it just because I
wanted to point out this two phase initialization - it may occasionally be relevant when deciding
what methods to overload.

I found the easiest loader to work off of was `importlib.machinery.SourceFileLoader`. This is
essentially the standard import system loader, and it's a concrete class that's already implemented
everything, so we can just overwrite the specific parts we care about. Unfortunately, the importlib
docs are very information dense, and the source code is very convoluted, using multiple inheritance
in several places, so finding what you want can still be quite a challenge. Eventually, I found
`FileLoader.get_data()`:

> Reads path as a binary file and returns the bytes from it.

Let's give it a shot.

```py
from importlib.machinery import SourceFileLoader

class StringSourceLoader(SourceFileLoader):
    source: bytes

    def __init__(self, fullname: str, source: bytes) -> None:
        super().__init__(fullname, path="<string>")
        self.source = source

    def get_data(self, path: str) -> bytes:
        return self.source
```

One oddity is this `path="<string>"` - while not required in the raw loader definition, basically
all the importlib machinery assumes you're loading from real files. Luckily, this is mostly just
visual, for debugging, like with tracebacks or `inspect.getfile`, it doesn't need to be a real path.

So we've got our loader. How do we turn it into a module spec? `importlib.util.spec_from_loader()`.

```py
>>> from importlib.util import spec_from_loader
>>> source_code = b"""
def get(url: str, timeout: int) -> str:
    raise NotImplementedError
"""
>>> loader = StringSourceLoader("demo_requests", source_code)
>>> next_module_spec = lambda _: spec_from_loader("demo_requests", loader)
>>> import demo_requests
>>> demo_requests.get("dummy", 1)
Traceback (most recent call last):
  File "<python-input-9>", line 1, in <module>
    demo_requests.get("dummy", 1)
    ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^
  File "<string>", line 3, in get
NotImplementedError
```

I'm sure you can imagine all sorts of wild things you could build on top of this.

# Source code replacements
...like this for one. Maybe don't do this.

All along we've been restrained by the fact that we can't just edit the source code of existing
mods. It would've been so much easier just to subtly tweak those `Mods/MyMod/dist` paths. Well if we
can load from raw bytes, who's to say we can't?

Now this only really works well in our specific scenario. We have a finite amount of legacy mods,
we know their exact source code, and we know they're never going to be edited (since updates will
built for the newer version). And in every case it was needed, I was able to talk to the original
mod author, and we agreed it was the best way to handle it. This was only ever used as the solution
of last resort.

You may have seen previous posts by others doing something similar to this using custom encodings
([example 1](https://pydong.org/posts/PythonsPreprocessor/),
[example 2](https://www.bitecode.dev/p/change-pythons-syntax-with-the-coding)). The problem with
using an encoding for us is it requires modifying the source files to add a magic `# coding` line.
An import hook can work without modifying the original files - with the caveat being that you need
to get the import hook registered *before* importing any of the files you want to modify. This
tradeoff works for us.

So to implement this, we want to find the module via the normal import process, but then edit the
file contents when it's loaded. So we're going to need a custom loader.

```py
class ReplacementSourceLoader(FileLoader, SourceLoader):
    def get_data(self, path: str) -> bytes:
        with open(path, "rb") as file:
            data = file.read()
            # Mess with the source code - perhaps use ast.parse()
            data += f'\nprint("module loaded: {self.name}")'.encode("utf8")
            return data
```

One oddity I ran into was that if I inherited from `SourceFileLoader` directly, it would sometimes
get given a path to a bytecode file. Which obviously causes problems when you're expecting text.
Inheriting from its two base classes did not do this. Some parts of the importlib machinery do
change behaviour based on which subclass is being used, but I didn't investigate this further.

Since we want to replace contents of an existing source file, the next step is to find where that
actually is. I briefly touched on how to do this earlier, we're going to want a new meta path finder
class.

```py
class ReplacementMetaPathFinder:
    @classmethod
    def find_spec(
        cls,
        fullname: str,
        path: Sequence[str] | None = None,
        target: ModuleType | None = None,
    ) -> ModuleSpec | None:
        spec = PathFinder.find_spec(fullname, path, target)
        if spec is None or not spec.has_location or spec.origin is None:
            return None

        # No-op: return spec using the same location as the default
        return spec_from_file_location(fullname, origin)
```

Finally, we can add some filtering on the specific import, and, when it matches, add our custom
loader. Putting it all together:

```py
import re
import sys
from collections.abc import Sequence
from importlib.abc import FileLoader, SourceLoader
from importlib.machinery import ModuleSpec, PathFinder
from importlib.util import spec_from_file_location
from types import ModuleType

class ReplacementSourceLoader(FileLoader, SourceLoader):
    def get_data(self, path: str) -> bytes:
        with open(path, "rb") as file:
            data = file.read()
            return re.sub(
                b'""".+"""',
                b'"vzcbeg ubbxf pna or qnatrebhf va gur jebat unaqf"',
                data,
                flags=re.S,
            )

class ReplacementMetaPathFinder:
    @classmethod
    def find_spec(
        cls,
        fullname: str,
        path: Sequence[str] | None = None,
        target: ModuleType | None = None,
    ) -> ModuleSpec | None:
        if fullname == "this":
            spec = PathFinder.find_spec(fullname, path, target)
            if spec is None or not spec.has_location or spec.origin is None:
                return None
            return spec_from_file_location(
                fullname,
                spec.origin,
                loader=ReplacementSourceLoader(fullname, spec.origin),
            )
        return None

# Has to be first to overwrite the normal import
sys.meta_path.insert(0, ReplacementMetaPathFinder)
import this
```

Give it a try :)
