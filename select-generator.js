var html = "";
for (var sec = 15; sec < 61; sec++) {
  html += "\t\t";
  html += `<option value="${sec}">${sec} sec.</option>`;
  html += "\n";
}
document.write(html);