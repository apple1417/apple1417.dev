---
title: Cracking BL4 Saves
description: Decrypting BL4 save files without knowing the encryption key.
---

Borderlands 4 is the first game in the series to start encrypting save files. It encrypts them using
a key derived from your account id - which also means you can't easily copy saves from someone else.
Most save editors so far have handed this by requiring both the save file and its' account id as
input. Unfortunately, they're currently all web apps, which means you need to manually look up your
id from somewhere first. A local program, like my
[bl4_auto_crypter](https://github.com/apple1417/bl4_auto_crypter), can be a little more clever, and
try grab it automatically. But local programs are still limited by assuming it's your save, that the
account id it finds on your system matches the save. What if all you had was a save file, with no
idea where it came from, is there still a way to decrypt it?

# Save File Format
Before we try crack an encrypted file, lets look at how the file format works.

A raw save is just a yaml file.
```yml
state:
  char_guid: F85894AE46F078AE34AC1A9082B55AB8
  class: Char_ExoSoldier
  char_name: Rafa
  player_difficulty: Hard
# ...
```

Firstly, this is compressed with zlib (using standard default settings). Then we append 4 bytes
holding the decompressed file size as a little endian u32 (which may be unaligned).

<style>
svg {
    max-width: 100%;
    display: block;
    margin: 0 auto;
}
svg text {
    dominant-baseline: middle;
    text-anchor: middle;
    fill: var(--text);
}
svg text[mono], svg text[num] {
    font-family: monospace;
    font-size: 11px;
}
svg text[num] {
    fill: var(--text-secondary);
}
svg line {
    stroke: var(--text);
    stroke-width: 1;
}
</style>
<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" width="681" height="131" viewBox="0 0 681 131">
  <text x="60" y="8" num>0</text>
  <text x="100" y="8" num>1</text>
  <text x="140" y="8" num>2</text>
  <text x="180" y="8" num>3</text>
  <text x="220" y="8" num>4</text>
  <text x="260" y="8" num>5</text>
  <text x="300" y="8" num>6</text>
  <text x="340" y="8" num>7</text>
  <text x="380" y="8" num>8</text>
  <text x="420" y="8" num>9</text>
  <text x="460" y="8" num>a</text>
  <text x="500" y="8" num>b</text>
  <text x="540" y="8" num>c</text>
  <text x="580" y="8" num>d</text>
  <text x="620" y="8" num>e</text>
  <text x="660" y="8" num>f</text>
  <line x1="40" y1="15" x2="680" y2="15"></line>
  <line x1="680" y1="15" x2="680" y2="75"></line>
  <line x1="40" y1="15" x2="40" y2="45"></line>
  <text x="360" y="31">Compressed Data</text>
  <line x1="40" y1="45" x2="680" y2="75" stroke-dasharray="1,1"></line>
  <line x1="40" y1="55" x2="40" y2="100"></line>
  <line x1="680" y1="85" x2="680" y2="100"></line>
  <line x1="40" y1="55" x2="680" y2="85" stroke-dasharray="1,1"></line>
  <line x1="40" y1="130" x2="160" y2="130"></line>
  <line x1="160" y1="100" x2="160" y2="130"></line>
  <line x1="40" y1="100" x2="40" y2="130"></line>
  <line x1="160" y1="100" x2="320" y2="100"></line>
  <line x1="160" y1="130" x2="320" y2="130"></line>
  <line x1="320" y1="100" x2="320" y2="130"></line>
  <line x1="160" y1="100" x2="160" y2="130"></line>
  <text x="240" y="116">Decompressed Size</text>
  <line x1="320" y1="100" x2="680" y2="100"></line>
  <line x1="320" y1="100" x2="680" y2="100"></line>
  <line x1="320" y1="130" x2="680" y2="130"></line>
  <line x1="680" y1="100" x2="680" y2="130"></line>
  <line x1="320" y1="100" x2="320" y2="130"></line>
  <text x="500" y="116">Padding</text>
</svg>

The next step is to add PKCS padding. This involves padding up to the *next* multiple of 16 bytes,
where each byte's value is the number of padding bytes. If the data is already a multiple of 16,
it'll add 16 bytes of padding.

<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" width="681" height="56" viewBox="0 0 681 56">
  <text x="60" y="8" num>0</text>
  <text x="100" y="8" num>1</text>
  <text x="140" y="8" num>2</text>
  <text x="180" y="8" num>3</text>
  <text x="220" y="8" num>4</text>
  <text x="260" y="8" num>5</text>
  <text x="300" y="8" num>6</text>
  <text x="340" y="8" num>7</text>
  <text x="380" y="8" num>8</text>
  <text x="420" y="8" num>9</text>
  <text x="460" y="8" num>a</text>
  <text x="500" y="8" num>b</text>
  <text x="540" y="8" num>c</text>
  <text x="580" y="8" num>d</text>
  <text x="620" y="8" num>e</text>
  <text x="660" y="8" num>f</text>
  <line x1="40" y1="15" x2="240" y2="15"></line>
  <line x1="40" y1="45" x2="240" y2="45"></line>
  <line x1="240" y1="15" x2="240" y2="45"></line>
  <line x1="40" y1="15" x2="40" y2="45"></line>
  <text x="140" y="31">Data</text>
  <line x1="240" y1="15" x2="280" y2="15"></line>
  <line x1="240" y1="45" x2="280" y2="45"></line>
  <line stroke-dasharray="1,3" x1="280" y1="15" x2="280" y2="45"></line>
  <line x1="240" y1="15" x2="240" y2="45"></line>
  <text x="260" y="31" mono>0b</text>
  <line x1="280" y1="15" x2="320" y2="15"></line>
  <line x1="280" y1="45" x2="320" y2="45"></line>
  <line stroke-dasharray="1,3" x1="320" y1="15" x2="320" y2="45"></line>
  <line stroke-dasharray="1,3" x1="280" y1="15" x2="280" y2="45"></line>
  <text x="300" y="31" mono>0b</text>
  <line x1="320" y1="15" x2="360" y2="15"></line>
  <line x1="320" y1="45" x2="360" y2="45"></line>
  <line stroke-dasharray="1,3" x1="360" y1="15" x2="360" y2="45"></line>
  <line stroke-dasharray="1,3" x1="320" y1="15" x2="320" y2="45"></line>
  <text x="340" y="31" mono>0b</text>
  <line x1="360" y1="15" x2="400" y2="15"></line>
  <line x1="360" y1="45" x2="400" y2="45"></line>
  <line stroke-dasharray="1,3" x1="400" y1="15" x2="400" y2="45"></line>
  <line stroke-dasharray="1,3" x1="360" y1="15" x2="360" y2="45"></line>
  <text x="380" y="31" mono>0b</text>
  <line x1="400" y1="15" x2="440" y2="15"></line>
  <line x1="400" y1="45" x2="440" y2="45"></line>
  <line stroke-dasharray="1,3" x1="440" y1="15" x2="440" y2="45"></line>
  <line stroke-dasharray="1,3" x1="400" y1="15" x2="400" y2="45"></line>
  <text x="420" y="31" mono>0b</text>
  <line x1="440" y1="15" x2="480" y2="15"></line>
  <line x1="440" y1="45" x2="480" y2="45"></line>
  <line stroke-dasharray="1,3" x1="480" y1="15" x2="480" y2="45"></line>
  <line stroke-dasharray="1,3" x1="440" y1="15" x2="440" y2="45"></line>
  <text x="460" y="31" mono>0b</text>
  <line x1="480" y1="15" x2="520" y2="15"></line>
  <line x1="480" y1="45" x2="520" y2="45"></line>
  <line stroke-dasharray="1,3" x1="520" y1="15" x2="520" y2="45"></line>
  <line stroke-dasharray="1,3" x1="480" y1="15" x2="480" y2="45"></line>
  <text x="500" y="31" mono>0b</text>
  <line x1="520" y1="15" x2="560" y2="15"></line>
  <line x1="520" y1="45" x2="560" y2="45"></line>
  <line stroke-dasharray="1,3" x1="560" y1="15" x2="560" y2="45"></line>
  <line stroke-dasharray="1,3" x1="520" y1="15" x2="520" y2="45"></line>
  <text x="540" y="31" mono>0b</text>
  <line x1="560" y1="15" x2="600" y2="15"></line>
  <line x1="560" y1="45" x2="600" y2="45"></line>
  <line stroke-dasharray="1,3" x1="600" y1="15" x2="600" y2="45"></line>
  <line stroke-dasharray="1,3" x1="560" y1="15" x2="560" y2="45"></line>
  <text x="580" y="31" mono>0b</text>
  <line x1="600" y1="15" x2="640" y2="15"></line>
  <line x1="600" y1="45" x2="640" y2="45"></line>
  <line stroke-dasharray="1,3" x1="640" y1="15" x2="640" y2="45"></line>
  <line stroke-dasharray="1,3" x1="600" y1="15" x2="600" y2="45"></line>
  <text x="620" y="31" mono>0b</text>
  <line x1="640" y1="15" x2="680" y2="15"></line>
  <line x1="640" y1="45" x2="680" y2="45"></line>
  <line x1="680" y1="15" x2="680" y2="45" stroke="#000000" strok></line>
  <line stroke-dasharray="1,3" x1="640" y1="15" x2="640" y2="45"></line>
  <text x="660" y="31" mono>0b</text>
</svg>
<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" width="681" height="56" viewBox="0 0 681 56">
  <text x="60" y="8" num>0</text>
  <text x="100" y="8" num>1</text>
  <text x="140" y="8" num>2</text>
  <text x="180" y="8" num>3</text>
  <text x="220" y="8" num>4</text>
  <text x="260" y="8" num>5</text>
  <text x="300" y="8" num>6</text>
  <text x="340" y="8" num>7</text>
  <text x="380" y="8" num>8</text>
  <text x="420" y="8" num>9</text>
  <text x="460" y="8" num>a</text>
  <text x="500" y="8" num>b</text>
  <text x="540" y="8" num>c</text>
  <text x="580" y="8" num>d</text>
  <text x="620" y="8" num>e</text>
  <text x="660" y="8" num>f</text>
  <line x1="40" y1="15" x2="520" y2="15"></line>
  <line x1="40" y1="45" x2="520" y2="45"></line>
  <line x1="520" y1="15" x2="520" y2="45"></line>
  <line x1="40" y1="15" x2="40" y2="45"></line>
  <text x="280" y="31">Data</text>
  <line x1="520" y1="15" x2="560" y2="15"></line>
  <line x1="520" y1="45" x2="560" y2="45"></line>
  <line stroke-dasharray="1,3" x1="560" y1="15" x2="560" y2="45"></line>
  <line stroke-dasharray="1,3" x1="520" y1="15" x2="520" y2="45"></line>
  <text x="540" y="31" mono>04</text>
  <line x1="560" y1="15" x2="600" y2="15"></line>
  <line x1="560" y1="45" x2="600" y2="45"></line>
  <line stroke-dasharray="1,3" x1="600" y1="15" x2="600" y2="45"></line>
  <line stroke-dasharray="1,3" x1="560" y1="15" x2="560" y2="45"></line>
  <text x="580" y="31" mono>04</text>
  <line x1="600" y1="15" x2="640" y2="15"></line>
  <line x1="600" y1="45" x2="640" y2="45"></line>
  <line stroke-dasharray="1,3" x1="640" y1="15" x2="640" y2="45"></line>
  <line stroke-dasharray="1,3" x1="600" y1="15" x2="600" y2="45"></line>
  <text x="620" y="31" mono>04</text>
  <line x1="640" y1="15" x2="680" y2="15"></line>
  <line x1="640" y1="45" x2="680" y2="45"></line>
  <line x1="680" y1="15" x2="680" y2="45" stroke="#000000" strok></line>
  <line stroke-dasharray="1,3" x1="640" y1="15" x2="640" y2="45"></line>
  <text x="660" y="31" mono>04</text>
</svg>
<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" width="681" height="76" viewBox="0 0 681 76">
  <text x="60" y="8" num>0</text>
  <text x="100" y="8" num>1</text>
  <text x="140" y="8" num>2</text>
  <text x="180" y="8" num>3</text>
  <text x="220" y="8" num>4</text>
  <text x="260" y="8" num>5</text>
  <text x="300" y="8" num>6</text>
  <text x="340" y="8" num>7</text>
  <text x="380" y="8" num>8</text>
  <text x="420" y="8" num>9</text>
  <text x="460" y="8" num>a</text>
  <text x="500" y="8" num>b</text>
  <text x="540" y="8" num>c</text>
  <text x="580" y="8" num>d</text>
  <text x="620" y="8" num>e</text>
  <text x="660" y="8" num>f</text>
  <line x1="40" y1="15" x2="680" y2="15"></line>
  <line x1="40" y1="45" x2="680" y2="45"></line>
  <line x1="680" y1="15" x2="680" y2="45"></line>
  <line x1="40" y1="15" x2="40" y2="45"></line>
  <text x="360" y="31" text-anchor="middle" dominant-baseline="middle">Data</text>
  <line x1="40" y1="45" x2="80" y2="45"></line>
  <line x1="40" y1="75" x2="80" y2="75"></line>
  <line stroke-dasharray="1,3" x1="80" y1="45" x2="80" y2="75"></line>
  <line x1="40" y1="45" x2="40" y2="75"></line>
  <text x="60" y="61" mono>10</text>
  <line x1="80" y1="45" x2="120" y2="45"></line>
  <line x1="80" y1="75" x2="120" y2="75"></line>
  <line stroke-dasharray="1,3" x1="120" y1="45" x2="120" y2="75"></line>
  <line stroke-dasharray="1,3" x1="80" y1="45" x2="80" y2="75"></line>
  <text x="100" y="61" mono>10</text>
  <line x1="120" y1="45" x2="160" y2="45"></line>
  <line x1="120" y1="75" x2="160" y2="75"></line>
  <line stroke-dasharray="1,3" x1="160" y1="45" x2="160" y2="75"></line>
  <line stroke-dasharray="1,3" x1="120" y1="45" x2="120" y2="75"></line>
  <text x="140" y="61" mono>10</text>
  <line x1="160" y1="45" x2="200" y2="45"></line>
  <line x1="160" y1="75" x2="200" y2="75"></line>
  <line stroke-dasharray="1,3" x1="200" y1="45" x2="200" y2="75"></line>
  <line stroke-dasharray="1,3" x1="160" y1="45" x2="160" y2="75"></line>
  <text x="180" y="61" mono>10</text>
  <line x1="200" y1="45" x2="240" y2="45"></line>
  <line x1="200" y1="75" x2="240" y2="75"></line>
  <line stroke-dasharray="1,3" x1="240" y1="45" x2="240" y2="75"></line>
  <line stroke-dasharray="1,3" x1="200" y1="45" x2="200" y2="75"></line>
  <text x="220" y="61" mono>10</text>
  <line x1="240" y1="45" x2="280" y2="45"></line>
  <line x1="240" y1="75" x2="280" y2="75"></line>
  <line stroke-dasharray="1,3" x1="280" y1="45" x2="280" y2="75"></line>
  <line stroke-dasharray="1,3" x1="240" y1="45" x2="240" y2="75"></line>
  <text x="260" y="61" mono>10</text>
  <line x1="280" y1="45" x2="320" y2="45"></line>
  <line x1="280" y1="75" x2="320" y2="75"></line>
  <line stroke-dasharray="1,3" x1="320" y1="45" x2="320" y2="75"></line>
  <line stroke-dasharray="1,3" x1="280" y1="45" x2="280" y2="75"></line>
  <text x="300" y="61" mono>10</text>
  <line x1="320" y1="45" x2="360" y2="45"></line>
  <line x1="320" y1="75" x2="360" y2="75"></line>
  <line stroke-dasharray="1,3" x1="360" y1="45" x2="360" y2="75"></line>
  <line stroke-dasharray="1,3" x1="320" y1="45" x2="320" y2="75"></line>
  <text x="340" y="61" mono>10</text>
  <line x1="360" y1="45" x2="400" y2="45"></line>
  <line x1="360" y1="75" x2="400" y2="75"></line>
  <line stroke-dasharray="1,3" x1="400" y1="45" x2="400" y2="75"></line>
  <line stroke-dasharray="1,3" x1="360" y1="45" x2="360" y2="75"></line>
  <text x="380" y="61" mono>10</text>
  <line x1="400" y1="45" x2="440" y2="45"></line>
  <line x1="400" y1="75" x2="440" y2="75"></line>
  <line stroke-dasharray="1,3" x1="440" y1="45" x2="440" y2="75"></line>
  <line stroke-dasharray="1,3" x1="400" y1="45" x2="400" y2="75"></line>
  <text x="420" y="61" mono>10</text>
  <line x1="440" y1="45" x2="480" y2="45"></line>
  <line x1="440" y1="75" x2="480" y2="75"></line>
  <line stroke-dasharray="1,3" x1="480" y1="45" x2="480" y2="75"></line>
  <line stroke-dasharray="1,3" x1="440" y1="45" x2="440" y2="75"></line>
  <text x="460" y="61" mono>10</text>
  <line x1="480" y1="45" x2="520" y2="45"></line>
  <line x1="480" y1="75" x2="520" y2="75"></line>
  <line stroke-dasharray="1,3" x1="520" y1="45" x2="520" y2="75"></line>
  <line stroke-dasharray="1,3" x1="480" y1="45" x2="480" y2="75"></line>
  <text x="500" y="61" mono>10</text>
  <line x1="520" y1="45" x2="560" y2="45"></line>
  <line x1="520" y1="75" x2="560" y2="75"></line>
  <line stroke-dasharray="1,3" x1="560" y1="45" x2="560" y2="75"></line>
  <line stroke-dasharray="1,3" x1="520" y1="45" x2="520" y2="75"></line>
  <text x="540" y="61" mono>10</text>
  <line x1="560" y1="45" x2="600" y2="45"></line>
  <line x1="560" y1="75" x2="600" y2="75"></line>
  <line stroke-dasharray="1,3" x1="600" y1="45" x2="600" y2="75"></line>
  <line stroke-dasharray="1,3" x1="560" y1="45" x2="560" y2="75"></line>
  <text x="580" y="61" mono>10</text>
  <line x1="600" y1="45" x2="640" y2="45"></line>
  <line x1="600" y1="75" x2="640" y2="75"></line>
  <line stroke-dasharray="1,3" x1="640" y1="45" x2="640" y2="75"></line>
  <line stroke-dasharray="1,3" x1="600" y1="45" x2="600" y2="75"></line>
  <text x="620" y="61" mono>10</text>
  <line x1="640" y1="45" x2="680" y2="45"></line>
  <line x1="640" y1="75" x2="680" y2="75"></line>
  <line x1="680" y1="45" x2="680" y2="75"></line>
  <line stroke-dasharray="1,3" x1="640" y1="45" x2="640" y2="75"></line>
  <text x="660" y="61" mono>10</text>
</svg>

The final step is to encrypt all this data, using AES-ECB. As mentioned earlier, the key is derived
from your account id.

The game uses the following base key:
```c
const uint8_t BASE_KEY[32] = {
    0x35, 0xec, 0x33, 0x77, 0xf3, 0x5d, 0xb0, 0xea, 0xbe, 0x6b, 0x83, 0x11, 0x54, 0x03, 0xeb, 0xfb,
    0x27, 0x25, 0x64, 0x2e, 0xd5, 0x49, 0x06, 0x29, 0x05, 0x78, 0xbd, 0x60, 0xba, 0x4a, 0xa7, 0x87,
};
```

This key is combined with your account id, using a different method based on where you bought the
game.

### Steam
Steam account ids are represented a few different ways. The one we're interested in is the one
generally just called "SteamID", which look something like `76561197979354471`. This is simply a
64-bit int.

To modify the key, simply xor the little endian u64 with the first 8 bytes.
```
76561197979354471 = 0x0110_0001_0123_4567

Steam ID: 0x67, 0x45, 0x23, 0x01, 0x01, 0x00, 0x10, 0x01
Base Key: 0x35, 0xec, 0x33, 0x77, 0xf3, 0x5d, 0xb0, 0xea
========================================================
xor'd:    0x52, 0xa9, 0x10, 0x76, 0xf2, 0x5d, 0xa0, 0xeb
```
Bytes 8-31 are the exact same as in the base key.

### Epic
Epic account ids are a 32 character/16 byte hex string - for example
`000102030405060708090a0b0c0d0e0f`.

The game gets this id as a utf16-le string, and then xors it with the base key.

```
Epic ID:   '0',        '0',        '0',        '1',       ...
utf16-le: 0x30, 0x00, 0x30, 0x00, 0x30, 0x00, 0x31, 0x00, ...
Base Key: 0x35, 0xec, 0x33, 0x77, 0xf3, 0x5d, 0xb0, 0xea, ...
=============================================================
xor'd:    0x05, 0xec, 0x03, 0x77, 0xc3, 0x5d, 0x81, 0xea, ...
```
By converting to utf16, the full string takes up 64 bytes, so the second half is just dropped. So
this is effectively mixing in 8 bytes worth of data.

There's an interesting side note here: Borderlands uses Unreal, which generally represents strings
as `wchar_t` arrays. These are 16-bit on Windows - which might well be the reason they're using
utf16. But on Linux/Mac, `wchar_t` is 32-bit. So if the game had Linux/Mac releases, it's possible
this might've lead to a different encryption key, which might've made a dev take a look at it and
switch it back down to ascii or just directly xoring the bytes.

# Format Weaknesses
So lets go over some of the weaknesses in this file format.

The main weakness simply is that we actually already know a lot of the key. Both Steam and Epic
accounts only actually contribute 64 bits of entropy. And if we go one step further, the format of a
Steam account ID is documented, and they generally only contain 32 bits of entropy.

[https://developer.valvesoftware.com/wiki/SteamID](https://developer.valvesoftware.com/wiki/SteamID)

Another thing I noticed while working on this was that these 32 bits seem to be assigned
sequentially - which means in practice you can probably assume the top couple bits are all 0 too.
I could not find any equivalent documentation for Epic.

The next weakness we can exploit is known plaintext. However, this isn't as useful as you might
think. We can't actually assume the format of the decompressed data, it's just yaml so save editors
can do things like change newlines or reorder fields. And then that data gets all compressed, and
compressed data is essentially random noise. We can only really rely on the following:
- The zlib header - 2 bytes, typically a fixed value, but save editors can change to one of 32.
- The zlib checksum - 4 bytes, requires decrypting entire file to check.
- The decompressed data length - 4 bytes, though we can only really reliably assume the MSB is 0,
  the rest can vary.
- The padding - ~1.5 bytes (more later)

The final thing to look at is the actual cipher, AES-ECB. AES is a block cipher, which takes a 16
byte block as input, and returns a scrambled 16 bytes of output. The AES block cipher is generally
considered uncrackable, your only option is to brute force it.

ECB is a "block cipher mode of operation", a way to run a block cipher over larger inputs. ECB is
actually the simplest possible mode: simply split the input into blocks, and run the same cipher
over each one. This means if any two input blocks are the same, they will produce the same output
block. Wikipedia has a great demonstration of the problems with this:

![ECB encrypted image](https://upload.wikimedia.org/wikipedia/commons/9/96/Tux_encrypted_ecb.png)
{: style="max-width: 30%; margin: auto"}

Unfortunately, this doesn't really help us. As mentioned above, due to compression, the input blocks
are all essentially random noise already, so even if we found two identical blocks it wouldn't tell
us much.

The other interesting part of ECB is that it lets us decrypt blocks out of order. Three of our known
plaintexts are at the end of the file, so ECB means it's possible for us to skip straight to the
last block to try work on those. Some other modes feed the result of previous blocks back into the
next, so you're forced to go through them all in order.

# Getting Cracking
So lets put this info together, and come up with an actual method to crack a save.

Firstly, we need to brute force. I can't come up with anything the cryptography world doesn't
already know, if they say AES is secure then it's secure. Consequently, I will be throwing out
handling Epic saves. While brute forcing a 64-bit AES key is doable, it does require a data center.
And I just want to have some fun, with some game saves, on my PC, locally. Brute forcing a 32-bit
Steam id is far more doable.

Since AES is a block cipher, and all our known plaintexts are smaller than a block, we don't
actually need to try decrypt the entire file every time. If we try decrypt the block, and it doesn't
match the plaintext, we can immediately throw that encryption key away.

Now this obviously doesn't work for the zlib checksum, since we need to decrypt the rest of the file
to work out what value to compare it against. But this can be a second verification step: if we pass
the first check, try decrypt the whole file, and if it decompresses (and thus had a valid checksum),
then we've almost certainly found the correct file.

If we try look for the padding bytes, only 1/16 random blocks will have a last byte which is in
range. Then if we read a 16, there's only one valid value for the rest of the block (all 16s). If we
read a 15, there's 256 (15 bytes + 1 data byte). To generalize, if the last block was N, there are
256^(16-N) possible valid values for the rest of the block. If you sum those all together, you get
that 1/255 blocks *with a valid last byte* will appear to have valid padding. Combining the two
numbers, 1/4080 blocks will get past this check.

Now once the padding's valid, we could also try check the decompressed data size. The actual value
of this will of course vary quite a bit, but we can assume the upper most bits are all 0. My saves
are around 160kb, so we need >16 bits. For simplicity (and to add some safety margin), lets say we
only check for the MSB being 0. In particular this means we don't need to worry about the size
tearing between blocks - if we have 16 bytes of padding, we ignore it, if we have 15 bytes then the
data byte must be a 0. Doing the same maths as before, 1/65280 blocks will pass the check. We could
push this a little further by checking for a couple more bits of 0s, though it gets a little more
complex.

Alternatively, the other option is to check the zlib header. The game uses the default compression
settings, which will always use the exact bytes 0x78, 0x9C - only 1/65536 blocks will match. This is
also a significantly simpler check than going through the padding. However, if a file's been save
edited, it's possible (though unlikely) the editor used different compression settings, giving a
different header. There end up being 32 possible headers, so if we want to accept all of them,
1/2048 blocks will pass the check.

[I implemented this here](https://codeberg.org/apple1417/bl4_save_brute_forcer), using the zlib
header method. It can brute force my own saves in ~10s, which seems like a great success. Scanning
the full 32-bit range takes ~5m, which is still relatively reasonable.

Benchmarking showed the vast majority of the time is spent decrypting the first block - in fact 30%
of the overall execution time is spent just *preparing* new AES keys. This means it's not worth
doing the more complex padding check to try get less false positives (if we checked for a couple
more 0s). It would slow down every check, when the false positives are already insignificant.

The last thing I'll note is how the multithreading spreads out the work. Since steam ids appear
sequential, we'll find the correct id quicker if we check all the lowest ids first. So threads get
interwoven ids, rather than chunked ones - thread 1 checks ids 0, 8, 16, thread 2 checks 1, 9, 17,
etc.

Putting this all together, our final method is:
1. Start with id 0.
2. Try decypt the first block.
3. If the block starts with the zlib header, try fully decrypt the file.
4. If the save decompresses cleanly, you've probably found the right id, exit.
5. Otherwise, increment the id, and repeat from step 2.

And multithread this to make it go faster.


