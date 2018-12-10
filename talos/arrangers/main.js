/*
  This file reads the data from data.js (which is auto generated) and uses it to create tables
   showing arranger solutions
  Doing it this way takes a lot less space than storing each table in the raw html file
*/

window.addEventListener("load", generateArrangers);

maskOrder = ["left", "top", "right", "bottom"];
function generateArrangers() {
    for (var name in data) {
        var mainDiv = document.getElementById(name)
        var classInfo = mainDiv.className;
        mainDiv.className = "";

        var table = "";
        for (var index = 0; index < data[name].length; index++) {
            var arranger = data[name][index]
            table += `<table class="` + classInfo + `">`;
            for (var y = 0; y < arranger.length; y++) {
                table += `<tr>\n`
                for (var x = 0; x < arranger[0].length; x++) {
                    // 0b1100 = LTRB = LT showing
                    var borders = "";
                    var mask = 0b1000;
                    for (var bit = 0; mask != 0; bit++) {
                        if ((arranger[y][x] & mask) != 0) {
                            borders += " " + maskOrder[bit];
                        }
                        mask >>= 1;
                    }

                    table += `<td class="` + borders +`"></td>\n`;
                }
                table += `</tr>`;
            }
            table += `</table>`
        }

        mainDiv.innerHTML = table;
    }
}
