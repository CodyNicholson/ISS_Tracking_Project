function generateTableHead(table, data) {
    let thead = table.createTHead();
    let row = thead.insertRow();
    for (let key of data) {
      let th = document.createElement("th");
      let text = document.createTextNode(key);
      th.appendChild(text);
      row.appendChild(th);
    }
}
  
function generateTable(table, data) {
    for (let i = data.length - 1; i >= 0; i--) {
      let row = table.insertRow();
      for (key in data[i]) {
        let cell = row.insertCell();
        let text = document.createTextNode(data[i][key]);
        cell.appendChild(text);
      }
    }
}
