let options = {
    ajax: "/bl3/uniques/sources.json",
    autoWidth: false,
    buttons: [
        "searchPanes"
    ],
    columnDefs: [{
        targets: [0, 1, 2, 3],
        searchPanes: {
            show: false
        },
        width: "25%",
    }, {
        targets: [4, 6, 7, 8],
        searchPanes: {
            controls: false,
            emptyMessage: "None",
            show: true,
        },
        visible: false,
    }, {
        targets: 5,
        searchPanes: {
            controls: false,
            orthogonal: "sp",
            show: true,
        },
        visible: false,
    }],
    columns: [
        {title: "Name"},
        {title: "Description"},
        {title: "Source"},
        {title: "Map"},
        {title: "Rarity"},
        {title: "Manufacturer"},
        {title: "Class"},
        {title: "Gear Type"},
        {title: "DLC"},
    ],
    dom: (
        "<'row'<'col-sm-12 col-md-3'l><'col-sm-12 col-md-6'f>"
        + "<'col-sm-12 col-md-3 text-md-end panes-button'B>>"
        + "<'row'<'col-sm-12'tr>>"
        + "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>"
    ),
    language: {
        search: "",
        searchPanes: {
            collapse: {
                _: "Filters (%d)",
                0: "Filters",
            }
        },
    },
    lengthMenu: [[10, 20, 50, 100, -1], [10, 20, 50, 100, "All"]],
    pageLength: 20,
    searchPanes: {
        columns: [4, 5, 6, 7, 8]
    }
};

let dt = null;
$(document).ready(function() {
    dt = $("#table").DataTable(options);
});
