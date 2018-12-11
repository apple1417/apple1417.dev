window.addEventListener("load", setup);

default_indexes = {
    A_Blue_1:   0, A_Blue_2:   0, A_Blue_3:   0, A_Blue_4:   0,
    A_Blue_5:   0, A_Blue_6:   0, A_Blue_7:   0, A_Blue_8:   0,
    A_Green_1:  0, A_Green_2:  0, A_Green_3:  0, A_Green_4:  0,
    A_Green_5:  0, A_Green_6:  0, A_Green_7:  0, A_Green_8:  0,
    A_Yellow_1: 0, A_Yellow_2: 0, A_Yellow_3: 0, A_Yellow_4: 0,
    A_Yellow_5: 0, A_Yellow_6: 0, A_Yellow_7: 0, A_Yellow_8: 0,
    A_Red_1:    0, A_Red_2:    0, A_Red_3:    0, A_Red_4:    0,
    A_Red_5:    0, A_Red_6:    0, A_Red_7:    0, A_Red_8:    0,
    B_Blue_1:   0, B_Blue_2:   0, B_Blue_3:   0, B_Blue_4:   0,
    B_Blue_5:   0, B_Blue_6:   0, B_Blue_7:   0, B_Blue_8:   0,
    B_Green_1:  0, B_Green_2:  0, B_Green_3:  0, B_Green_4:  0,
    B_Green_5:  0, B_Green_6:  0, B_Green_7:  0, B_Green_8:  0,
    B_Yellow_1: 0, B_Yellow_2: 0, B_Yellow_3: 0, B_Yellow_4: 0,
    B_Yellow_5: 0, B_Yellow_6: 0, B_Yellow_7: 0, B_Yellow_8: 0,
    B_Red_1:    0, B_Red_2:    0, B_Red_3:    0, B_Red_4:    0,
    B_Red_5:    0, B_Red_6:    0, B_Red_7:    0, B_Red_8:    0,
    C_Blue_1:   0, C_Blue_2:   0, C_Blue_3:   0, C_Blue_4:   0,
    C_Blue_5:   0, C_Blue_6:   0, C_Blue_7:   0, C_Blue_8:   0,
    C_Green_1:  0, C_Green_2:  0, C_Green_3:  0, C_Green_4:  0,
    C_Green_5:  0, C_Green_6:  0, C_Green_7:  0, C_Green_8:  0,
    C_Yellow_1: 0, C_Yellow_2: 0, C_Yellow_3: 0, C_Yellow_4: 0,
    C_Yellow_5: 0, C_Yellow_6: 0, C_Yellow_7: 0, C_Yellow_8: 0,
    C_Red_1:    0, C_Red_2:    0, C_Red_3:    0, C_Red_4:    0,
    C_Red_5:    0, C_Red_6:    0, C_Red_7:    0, C_Red_8:    0
}
indexes = null;

darkBackground = null;
overlay = null;
function setup() {
    // Grab a few elements we'll be using a bit
    darkBackground = document.getElementById("darkBackground");
    overlay = document.getElementById("overlay");

    // Make sure we have all the data we need in localStorage
    if (localStorage.currentHub == null) {
        localStorage.currentHub = "A";
    }
    changeHub(localStorage.currentHub);

    if (localStorage.indexes == null) {
        localStorage.indexes = JSON.stringify(default_indexes);
    }
    // This convienently also gives us a copy of the object rather than a refrence
    indexes = JSON.parse(localStorage.indexes);

    // Generate all the arrangers
    for (var name in data) {
        var div = document.getElementById(name);
        var classes = div.classList[0];
        div.classList.remove(classes);

        var onclick = "";
        if (data[name].length > 1) {
            onclick = `showFull("` + name + `");`;
            classes += " pointer";
        }

        generateArranger(div, name, indexes[name], classes, onclick);
    }
}

// This function is just used to change which hub is showing
function changeHub(id) {
    document.getElementById(localStorage.currentHub).classList.add("hidden");
    document.getElementById(id).classList.remove("hidden");
    document.getElementById("select" + localStorage.currentHub).classList.remove("underline");
    document.getElementById("select" + id).classList.add("underline");
    localStorage.currentHub = id;
}

// This functon resets everything is localStorage to defaults
function defaultSettings() {
    changeHub("A");
    for (var name in indexes) {
        selectArranger(name, default_indexes[name]);
    }
}

/*
  This function reads the data from data.js (which is auto generated) and uses it to create the tables showing
   arranger solutions
  Doing it this way takes a lot less space than storing each table in the raw html file
*/
maskOrder = ["left", "top", "right", "bottom"];
function generateArranger(container, name, index, classes = "", onclick = "") {
    if (classes != "") {
        classes = ` class="` + classes + `"`;
    }
    if (onclick != "") {
        onclick.replace(/'/, `"`);
        onclick = " onclick='" + onclick + "'";
    }

    var arranger = data[name][index];
    var table = "";
    table += `<table` + classes + onclick + `>`;
    for (var y = 0; y < arranger.length; y++) {
        table += `<tr>`;
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
            table += `<td class="` + borders +`"></td>`;
        }
        table += `</tr>`;
    }
    container.innerHTML += table + `</table>`;
}

// This function returns to the default screen and replaces the default arranger with whatever the user clicked
function selectArranger(name, index) {
    hideFull();
    
    var arranger = document.getElementById(name);

    var classes = arranger.children[0].classList[0];
    var onclick = "";
    if (data[name].length > 1) {
        onclick = `showFull("` + name + `");`;
        classes += " pointer";
    }

    arranger.innerHTML = "";
    generateArranger(arranger, name, index, classes, onclick);

    indexes[name] = index;
    localStorage.indexes = JSON.stringify(indexes);
}

// This function brings up the menu to show all optimal solutions for a particular arranger
function showFull(name) {
    darkBackground.classList.remove("hidden");
    overlay.classList.replace("hidden", "flex");
    overlay.innerHTML = "";

    var arranger = data[name];
    var classes = document.getElementById(name).children[0].classList[0] + " pointer";

    for (var index = 0; index < arranger.length; index++) {
        generateArranger(overlay, name, index, classes, `selectArranger("` + name + `", ` + index + `);`)
    }
}
// This function returns to the default screen
function hideFull() {
    darkBackground.classList.add("hidden");
    overlay.classList.replace("flex", "hidden");
}
