const EPOCH = new Date(Date.UTC(1999, 1 /* = FEB */, 18, 12));
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function get_week_seed(date) {
    let date_copy = new Date(date.valueOf());
    date_copy.setHours(date_copy.getHours() - 17);
    if (((date_copy.getMonth() - 3) & 0xFFFFFFFF) > 8) {
        date_copy.setHours(date_copy.getHours() + 1);
    }
    return Math.floor((date_copy - EPOCH) / MS_PER_WEEK);
}

const THIS_WEEK = get_week_seed(new Date());

function srand_once(seed) {
    let x = (seed * 0xbb38435 + 0x3619636b) & 0xFFFFFFFF;
    x = x & 0x7fffff | 0x3f800000;
    let buf = new ArrayBuffer(4);
    new Uint32Array(buf)[0] = x;
    let f = new Float32Array(buf)[0];
    return f - Math.floor(f);
}

function pick_from_arr(week, arr) {
    let arr_copy = [...arr];
    for (let i = (week - (week % arr_copy.length)); i < week; i++) {
        arr_copy.splice(Math.floor(srand_once(i) * arr_copy.length), 1);
    }
    return arr_copy[Math.floor(srand_once(week) * arr_copy.length)];
}

let dt = null;

function generate_vendors() {
    let start_date = $("#start-date")[0].valueAsDate;
    if (start_date == null) {
        return;
    }

    let start_week = get_week_seed(start_date);
    let count = $("#num-weeks")[0].valueAsNumber;

    let data = [];
    for (let i = start_week; i < (start_week + count); i++) {
        let week_date = new Date(start_date.valueOf());
        week_date.setDate(start_date.getDate() + (7 * (i - start_week)));
        data.push([{date: week_date, idx: i}, pick_from_arr(i, LOCATIONS), ...pick_from_arr(i, POOLS)]);
    }

    dt.clear();
    dt.rows.add(data);
    dt.draw();
}

$(document).ready(function() {
    dt = $("#table").DataTable({
        columns: [
            {title: "Date", render: function(data) {
                return data.date.toLocaleDateString();
            }},
            {title: "Location", render: function(data) {
                return `${data.text} <sup><a href="${data.url}">(img)</a></sup>`;
            }},
            {title: "Item 1"},
            {title: "Item 2"},
            {title: "Item 3"},
        ],
        createdRow: function (row, data, index) {
            if (data[0].idx == THIS_WEEK) {
                row.classList.add("this-week");
            }
            if (data[1].disabled) {
                row.classList.add("disabled-vendor");
            }
        },
        dom: "<'#table-header.row'<'col-sm-12 col-md-9'f>><'row'<'col-sm-12'tr>>",
        language: {
            search: "",
        },
        ordering: false,
        paging: false,
    });

    $("#table-header")[0].prepend($("#date-template")[0].content.cloneNode(true));
    $("#start-date")[0].valueAsDate = new Date();
    $("#generate-btn").click(generate_vendors);

    generate_vendors();
});
