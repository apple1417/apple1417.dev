# Generates data.js
# Rather than try to work out how darkid's script works and edit it's output, I just read pipe the
#  output into this and parse it
import re
from shutil import move
from sys import stdin

INDENT = 4
RE_HEADER = re.compile(r"Challenge \"(.*?)\".*?cost: (\d+).*?Found (\d+) solutions:", re.S)
RE_ARRANGER = re.compile(r"([\d.]+)[\n\r]+([+\-|\s]+?)(?=\d|Challenge)")
# This the size from the var in darkid's script, each block is 2*SIZE-1 wide and SIZE-1 tall not
#  including the edges
SIZE = 4

# Just incase you do something wrong keep a backup
try:
    move("data.js", "data.js.bak")
except:
    pass
file = open("data.js", "w")
file.write("data = {\n")

current_data = ""
first_arranger = True
arranger_name = ""
arranger_cost = ""
arranger_count = 0

# This function does the actual work parsing each arranger
def parseArranger(dump):
    dump_lines = dump.split("\n")

    width = int((len(dump_lines[0]) - 1)/(2 * SIZE))
    height = int((len(dump_lines) - 1)/SIZE)

    # The border is stored as a 4-bit number:
    #  0b1100 = LTRB = LT showing
    borders = [[0 for x in range(width)] for y in range(height)]

    # Horizontal lines
    for y in range(height + 1):
        for x in range(width):
            full_x = 1 + SIZE * 2 * x
            full_y = SIZE * y
            if dump_lines[full_y][full_x] == "-":
                if y < height:
                    borders[y][x] |= 0b0100
                if y > 0:
                    borders[y - 1][x] |= 0b001

    # Vertical lines
    for y in range(height):
        for x in range(width + 1):
            full_x = SIZE * 2 * x
            full_y = 1 +SIZE * y
            if dump_lines[full_y][full_x] == "|":
                if x < width:
                    borders[y][x] |= 0b1000
                if x > 0:
                    borders[y][x - 1] |= 0b010

    # Output to file
    file.write(" "*INDENT*2 + str(borders))
    if arranger_count != 0:
        file.write(",")
    file.write("\n")

# This converts piped in input from darkid's script into the vars we need to parse it
for line in stdin:
    current_data += line
    if arranger_count == 0:
        match = RE_HEADER.match(current_data)
        if match == None:
            continue
        current_data = ""
        arranger_name = match.group(1)
        arranger_cost = match.group(2)
        arranger_count = int(match.group(3))

        # Setup the object for this arranger, and maybe finish the one for the last
        if first_arranger:
            file.write(" "*INDENT + arranger_name + ": [\n")
            first_arranger = False
        else:
            file.write(" "*INDENT + "],\n" + " "*INDENT + arranger_name + ": [\n")
    else:
        match = RE_ARRANGER.match(current_data)
        if match == None:
            continue
        current_data = line
        arranger_count -= 1
        if match.group(1) != arranger_cost:
            continue
        parseArranger(match.group(2))

file.write(" "*INDENT + "]\n}")
file.close()
