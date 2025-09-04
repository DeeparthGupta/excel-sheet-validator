export function applyTableStyles(datatable) {
    if (!datatable) return;

  datatable.style.setStyle('.row-ok td', {
    backgroundColor: '#a1f1b4' 
  });

  datatable.style.setStyle('.row-error td', {
    backgroundColor: '#eba7ad' 
  });

  datatable.style.setStyle('.cell-error', {
    backgroundColor: '#c42837' 
  });
}
