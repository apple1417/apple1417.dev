---
title: Python Import Hooks and Module Aliasing
description: How to use import hooks to create and debug aliased module names
---

<script>
    window.addEventListener("load", _ => {
        document.querySelectorAll(".no-lineno[start-line]").forEach(x => {
            const s = +x.getAttribute("start-line");
            const l = x.querySelector("pre.lineno");
            const n = (l.innerText.match(/\n/g)||[]).length;
            l.innerText = [...Array(n).keys()].map(i => i + s).join("\n");
            x.classList.remove("no-lineno");
        });
    });
</script>

**Update 2025-12-14:**
I've written a [new post]({% link _posts/2025-12-14-python-import-hooks-in-practice.md %}) on
import hooks, which I think is a better introduction to them. This post still covers some extra
content more specific to creating module aliases however.

---

It turns out, most of the Python import system is written in Python itself, and is quite
customizable. There generally isn't much reason to touch these however, so there aren't many
examples of how to use out there. In this post I'll go over how I tried using import hooks to allow
importing modules under a legacy name.

This post is written targeting Python 3.12.3, though I wouldn't expect things to change too much in
future versions.

# Background
I've been working on the [Borderlands 2/TPS Python SDK](https://github.com/bl-sdk/willow2-mod-manager/),
which allows creating mods via python scripts. There are a number of issues with the original
version, which have necessitated breaking changes to make improvements. But because there are so
many existing mods, we need a compatibility layer to try keep them running until they're upgraded.
The particular thing we'll be talking about today is to do with how the sdk modules are laid out.

The original sdk was initialized by importing the `Mods` module. `Mods/__init__.py` was then written
to scan for all subfolders, and try auto import them. This meant that very single mod ends up
packaged under the `Mods` module, e.g. `Mods.ModMenu`.

The newer sdk instead swaps out the `Mods` module for running a specific initialization script
instead. Because of this, we don't need the mods folder to be it's own module, all mods are now top
level modules.

So this means if you have a folder `Mods/ModMenu/`, under the old sdk you'd import it via
`Mods.ModMenu`, while under the new one it's just under `ModMenu`. We cannot trust users to handle
two mods folders, and correctly split old and new mods between them. Instead, we need the
compatibility layer to redirect all the existing `from Mods import ModMenu` imports to just
`import ModMenu`.

# Basic module aliases
So lets take a step back from adding compatibility for *all* mods. If you've just renamed a single
module, how can you create an alias from the deprecated name back to it. This actually turns out to
be quite simple.

`sys.modules` is a dictionary holding all loaded modules. It maps their name to the module object -
so we can simply add a new entry with a different name. You just need to make sure to set this up
before any imports using the old name.

```py
import sys

try:
    import old_module  # throws
except ImportError:
    pass

import new_module
sys.modules["old_module"] = new_module

import old_module  # ok

assert old_module == new_module  # True
```

If you've made enough changes, you may want to create a separate compatibility module, and alias
that instead.

We can also use this to temporarily alter the semantics of a given module. For example, both
versions of the sdk have an `unrealsdk` module, but it's structured somewhat differently. Given
a compatibility module which replicates the old structure, we can try the following:

```py
import sys
from collections.abc import Iterator
from contextlib import contextmanager

import unrealsdk as new_unrealsdk
from . import old_unrealsdk

@contextmanager
def legacy_compat() -> Iterator[None]:
    sys.modules["unrealsdk"] = old_unrealsdk
    try:
        yield
    finally:
        sys.modules["unrealsdk"] = new_unrealsdk
```
```py
with legacy_compat():
    import unrealsdk  # gives the old sdk compat module
```

Now we could certainly try do this for all the built in modules, and it would work perfectly fine.
However, in our actual use case, we need this to work for *all* mods. And mods don't just import sdk
builtins, they import their own submodules, and they import other library mods. We need another
solution to redirect them all programmatically.

# Your first import hook
So, let's try an import hook. How do you even get started? The relevant docs are the
[import system](https://docs.python.org/3/reference/import.html) and
[`importlib`](https://docs.python.org/3/library/importlib.html) - but these are very information
dense, and don't have great examples. It's best to keep them open, you'll probably want to refer
back to them a lot.

To start simple, lets just write a hook which logs when it's called.
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

sys.meta_path.insert(0, LoggingMetaPathFinder)
```
At it's most basic, a meta path finder has this single `find_spec` method, which attempts to find
and return a `ModuleSpec` for the given module. If it doesn't know how to import it, it should
return `None`. All meta path finders in `sys.meta_path` are tried in sequence, stopping once the
first one returns a spec.

There's also a second type of import hook, a path entry finder. I didn't need to use these, so can't
really give any guidance, but to my understanding, they've given the spec, and are responsible for
"compiling" it.

So we have this finder, let's try it out.
```py
>>> import xml.etree.ElementTree as ET
xml None None
xml.etree ['/usr/lib/python3.12/xml'] None
xml.etree.ElementTree ['/usr/lib/python3.12/xml/etree'] None
weakref None None
xml.etree.ElementPath ['/usr/lib/python3.12/xml/etree'] None
_elementtree None None
copy None None
pyexpat None None
>>> _ = importlib.reload(ET)
xml.etree.ElementTree ['/usr/lib/python3.12/xml/etree'] <module 'xml.etree.ElementTree' from '/usr/lib/python3.12/xml/etree/ElementTree.py'>
```

Firstly, we can note that importing a submodule first imports it's parents - as you could probably
have guessed. When importing a submodule, it's also passed a list of paths to look for the submodule
in, sourced from the `__path__` of it's parent module. If you reload a module, it's passed as the
target - though to be honest I have no idea what you're supposed to do with it.

# Creating the aliases
So we know how to create an import hook. This seems simple enough, since the import system is all
written in Python anyway, let's just inherit an existing meta path finder, and rename all the mods
modules.

```py
import sys
from collections.abc import Sequence
from importlib.machinery import ModuleSpec, PathFinder
from types import ModuleType

class ModMetaPathFinder(PathFinder):
    @classmethod
    def find_spec(
        cls,
        fullname: str,
        path: Sequence[str] | None = None,
        target: ModuleType | None = None,
    ) -> ModuleSpec | None:
        print(fullname, path, target)
        return super().find_spec(fullname.removeprefix("Mods."), path, target)

sys.meta_path.append(ModMetaPathFinder)  # This time we append so that it's a fallback
```

To allow you to follow along in a standard repl, we'll try import `importlib` as if it were a mod.
```py
>>> import Mods.importlib
Mods None None
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
ModuleNotFoundError: No module named 'Mods'
```

Hmm, of course.

In order for python to even try import `Mods.importlib`, it must first successfully import `Mods`.
But this module doesn't exist anymore. Instead, we need to create a fake `sys.modules` entry.
Luckily, you can just create a new module using `ModuleType`.

```py
>>> sys.modules["Mods"] = ModuleType("Mods")
>>> import Mods.importlib
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
ModuleNotFoundError: No module named 'Mods.importlib'; 'Mods' is not a package
```

Now this is a more interesting one. This relies on the subtle distinction between a *module* and a
*package*.

For an example, let's look at the layout of `concurrent`
```sh
> tree -I __pycache__ /usr/lib/python3.12/concurrent
/usr/lib/python3.12/concurrent
├── futures
│   ├── _base.py
│   ├── __init__.py
│   ├── process.py
│   └── thread.py
└── __init__.py

2 directories, 5 files
```
Any folder with an `__init__.py` is a *package*, which you can import using it's folder name. We can
`import concurrent` because `concurrent/__init__.py` exists, making `concurrent` a *package*.
Similarly, `import concurrent.futures` works because `futures` is a package, and because it's parent
folder is a package.

The other loose python files within the folder are simply *modules*, which we import using their
filename. We can `import concurrent.futures.process` because `concurrent.futures` is a package, and
`concurrent/futures/process.py` is a file within it. But because `process.py` is simply a module, we
can never `import concurrent.futures.process.submodule` - which gives the same error we saw.

So how can we turn our fake `Mods` module into a package? I've kind of already mentioned this, the
only difference between a module and a package is the presence of the `__path__` attribute.
```py
>>> concurrent.__path__
['/usr/lib/python3.12/concurrent']
>>> concurrent.futures.__path__
['/usr/lib/python3.12/concurrent/futures']
>>> concurrent.futures.process.__path__
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
AttributeError: module 'concurrent.futures.process' has no attribute '__path__'. Did you mean: '__name__'?
```

To quote the docs:
> `__path__`
>> If the module is a package (either regular or namespace), the module object’s `__path__`
>> attribute must be set. The value must be iterable, but may be empty if `__path__` has no further
>> significance. If `__path__` is not empty, it must produce strings when iterated over. More
>> details on the semantics of `__path__` are given below.
>> 
>>  Non-package modules should not have a `__path__` attribute.

So since there's no meaningful path we can give, sure sounds like we should make it an empty list?
Unfortuanely, it seems this line is more targeted towards if you're implementing `find_spec`
completely from scratch. When we pass `PathFinder.find_spec` an empty list, it fails to find
anything.

For example, trying this on what we observed earlier:
```py
>>> PathFinder.find_spec("xml.etree.ElementTree", ["/usr/lib/python3.12/xml/etree"], None)
ModuleSpec(name='xml.etree.ElementTree', loader=<_frozen_importlib_external.SourceFileLoader object at 0x7f585a1f0ec0>, origin='/usr/lib/python3.12/xml/etree/ElementTree.py')
>>> PathFinder.find_spec("xml.etree.ElementTree", [], None)
>>> 
```

Solving this requires some reading between the lines.

> The `find_spec()` method of meta path finders is called with two or three arguments. The first is
> the fully qualified name of the module being imported, for example `foo.bar.baz`. The second
> argument is the path entries to use for the module search. For top-level modules, the second
> argument is `None`, but for submodules or subpackages, the second argument is the value of the
> parent package’s `__path__` attribute.

When importing a submodule, it copies the value of the parent's `__path__`. When importing a top
level module, it uses `None`. So what if the parent's `__path__` *is* `None`?

```py
>>> sys.modules["Mods"].__path__ = None
>>> import Mods.importlib
>>> 
```
Success!

# Do we need an import hook?
So wait a minute, remember that print statement we put in `find_spec`? Why didn't it fire?

Let's try a simpler example.
```py
import sys
from types import ModuleType

Mods = ModuleType("Mods")
Mods.__path__ = None
sys.modules["Mods"] = Mods

import Mods.importlib
```

..that also works. If you add the `LoggingMetaPathFinder` back, you'll see it tries to import
`Mods.importlib` with a path of `None` - which means look for a top level module called `importlib`.
And one of the builtin import hooks finds it before it ever gets to ours.

So since we don't actually want to change the import semantics, we just want to add fake packages to
the chain, it turns out we can just have `__path__` do all the heavy lifting for us.

It doesn't just need to be setting it to `None` either, you can use it to alias stuff further down
an import path.
```py
test = ModuleType("test")
test.__path__ = ["/usr/lib/python3.12/xml/etree"]
sys.modules["test"] = test
from test import ElementTree
```

Or to join multiple packages in completely different locations together.
```py
merged = ModuleType("merged")
merged.__path__ = [
    "/usr/lib/python3.12/concurrent",
    "/usr/lib/python3.12/importlib",
    "/usr/lib/python3.12/xml/etree",
]
sys.modules["merged"] = merged
from merged import futures, machinery, ElementTree
```

These fake modules themselves are of course empty, all they do is allow importing submodules.

# We'll use an import hook anyway
Now there's there's one more issue I ran into, which I couldn't so easily run into in the toy
examples, and which only really makes sense with the context of `Mods.__path__` actually doing most
of the heavy lifting. If you are going to use an import hook, you'll need to fix this up too.

The old sdk shipped with a `Mods.ModMenu` module, which, unsurprisingly, implemented the mod menu. 
The new mod menu works a bit different, so I was developing a compatibility module under
`legacy_compat.ModMenu`. So if we can strip out a prefix, surely we can replace one too?

```py
if fullname.startswith("Mods.ModMenu"):
    new_name = f"{__name__}.{fullname.removeprefix("Mods.")}"
    new_path = tuple(__path__)
    return super().find_spec(new_name, new_path, target)
```
Since this is a submodule, we have to replace the path we're searching on too.

So, let's try this out.
```py
>>> with legacy_compat():
...   import Mods.ModMenu  # ok
...   import Mods.SomeOtherMod.SubModule  # ok
...   import Mods.ModMenu.ModObjects
... 
KeyError: 'Mods.ModMenu'

At:
  <frozen importlib._bootstrap>(1314): _find_and_load_unlocked
  <frozen importlib._bootstrap>(1360): _find_and_load
  <string>(6): <module>
```

Huh. Well, we have a traceback, what's it line up with in the source?

{:.no-lineno start-line="1312"}
```py
if name in sys.modules:
    return sys.modules[name]
parent_module = sys.modules[parent]
try:
    path = parent_module.__path__
except AttributeError:
    msg = f'{_ERR_MSG_PREFIX}{name!r}; {parent!r} is not a package'
    raise ModuleNotFoundError(msg, name=name) from None
```
<script>
    document.querySelectorAll(".no-lineno[start-line=\"1312\"] span.err").forEach(x => {
        x.classList.replace("err", "si");
        x.nextSibling.classList.replace("n", "si")
    });
</script>

Side note: seems that's what was throwing that error we saw earlier.

So our module isn't in `sys.modules`. What exactly is?
```py
>>> sys.modules.keys()
...
'legacy_compat.ModMenu.Options',
'legacy_compat.ModMenu.ModObjects',
'legacy_compat.ModMenu',
'Mods',
'Mods.SomeOtherMod',
'Mods.SomeOtherMod.ModMenu',
...
```

With hindsight, we know `Mods.SomeOtherMod` was imported by one of the builtin import hooks, by
checking `Mods.__path__`, because `SomeOtherMod` is a top level module. `ModMenu` isn't a top level
module, it's a submodule, so the builtin hook couldn't find it, and it fell through to our hook,
which is saving it under the renamed name. Because `Mods.ModMenu` doesn't exist in `sys.modules`,
trying to import a submodule of it immediately fails.

So let's ignore the `Mods.__path__` trick, let's put our import hook first in the list. This makes
every single submodule import fail this way. How do we fix it? How do we affect what the name saved
in `sys.modules` is?

By logging what the spec returns, we know our modules get a `SourceFileLoader` by default. Poking
around the importlib source code I can work out a rough code flow of `SourceFileLoader` ->
`_LoaderBasics.load_module` -> `_load_module_shim` -> `_exec`.

`/usr/lib/python3.12/importlib/_bootstrap.py`:

{:.no-lineno start-line="867"}
```py
        finally:
            # Update the order of insertion into sys.modules for module
            # clean-up at shutdown.
            module = sys.modules.pop(spec.name)
            sys.modules[spec.name] = module
    return module
```

So it just copies `spec.name`. Could've guessed. Let's just set it back to the original before
returning.

```py
import sys
from collections.abc import Sequence
from importlib.machinery import ModuleSpec, PathFinder
from types import ModuleType

Mods = ModuleType("Mods")
PATH_SENTINEL = object()
Mods.__path__ = PATH_SENTINEL  # Not using the None trick this time
sys.modules["Mods"] = Mods

class ModMetaPathFinder(PathFinder):
    @classmethod
    def find_spec(
        cls,
        fullname: str,
        path: Sequence[str] | None = None,
        target: ModuleType | None = None,
    ) -> ModuleSpec | None:
        if not fullname.startswith("Mods."):
            return None

        # When importing from directly under `Mods`, search for top level modules
        if path is PATH_SENTINEL:
            path = None

        spec = super().find_spec(fullname.removeprefix("Mods."), path, target)
        if spec is None:
            return None

        spec.name = fullname
        return spec

sys.meta_path.insert(0, ModMetaPathFinder)  # At the front this time
```
```py
>>> import Mods.importlib
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
ImportError: loader for importlib cannot handle Mods.importlib
```

Not a particularly helpful error message. The exact same loader is perfectly happy to load it
normally, so this is interesting. Searching for this error message quickly brings up the following.

`/usr/lib/python3.12/importlib/_bootstrap_external.py`:

{:.no-lineno start-line="635"}
```py
def _check_name(method):
    """Decorator to verify that the module being requested matches the one the
    loader can handle.

    The first argument (self) must define _name which the second argument is
    compared against. If the comparison fails then ImportError is raised.

    """
    def _check_name_wrapper(self, name=None, *args, **kwargs):
        if name is None:
            name = self.name
        elif self.name != name:
            raise ImportError('loader for %s cannot handle %s' %
                                (self.name, name), name=name)
        return method(self, name, *args, **kwargs)
```

Seems they've arbitrarily decided `self.name` on the loader needs to match the `name` arg to
whatever function this is decorated on, and there are a decent few. We could go change this value
too and keep diving though the code, or maybe inherit a new loader and remove the check, but there's
a better way.

See so far we've been trying to keep our tweaks as minimal as possible, we've basically only
intercepted the module name passed to `find_spec`. The import system is written to give you far
greater control, you can make far greater reaching changes - and as part of this, `importlib`
contains a number of useful helper functions so that you don't need to write them yourselves. The
one we're interested in is `importlib.util.spec_from_file_location` - a lot of custom import systems
presumably still want to interface with files on disk. This takes a name, which we pass the original
`Mods.abc` (which we want to end up in `sys.modules`) to, and a location, which we can get from the
spec for the renamed module.

```py
import sys
from collections.abc import Sequence
from importlib.machinery import ModuleSpec, PathFinder
from importlib.util import spec_from_file_location
from types import ModuleType

Mods = ModuleType("Mods")
PATH_SENTINEL = object()
Mods.__path__ = PATH_SENTINEL
sys.modules["Mods"] = Mods

class ModMetaPathFinder(PathFinder):
    @classmethod
    def find_spec(
        cls,
        fullname: str,
        path: Sequence[str] | None = None,
        target: ModuleType | None = None,
    ) -> ModuleSpec | None:
        if not fullname.startswith("Mods."):
            return None

        if path is PATH_SENTINEL:
            path = None

        spec = super().find_spec(fullname.removeprefix("Mods."), path, target)
        if spec is None or not spec.has_location or spec.origin is None:
            return None

        return spec_from_file_location(fullname, spec.origin)

sys.meta_path.insert(0, ModMetaPathFinder)
```
```py
>>> import Mods.importlib
>>> sys.modules.keys()
...
'Mods',
'Mods.importlib._bootstrap',
'Mods.importlib',
...
```

This time, we've actually got it all working properly - and with a bunch of extra code specifically
to make sure we're not taking advantage of the `Mods.__path__` trick.

Now in reality, I got this far before I properly worked out how to use the trick. Knowing it, this
is kind of useless, it's a bunch of extra code and complexity just to do the same thing that you
pretty much have to do anyway. Even in this final version of code, you still need to pass `None` to
`super().find_spec` so that it searches for top level modules, might as well cut out the middle man.
But it serves as a nice jumping off point for creating a more complex import hook, one that actually
needs to be a hook - you could use any arbitrary logic you want to pick what file to import.
