const columnIndexToLetter = (index: number) => {
  let result = "";
  let current = index;
  while (current > 0) {
    const modulo = (current - 1) % 26;
    result = String.fromCharCode(65 + modulo) + result;
    current = Math.floor((current - 1) / 26);
  }
  return result;
};

export const getRowRange = (
  sheetName: string,
  rowNumber: number,
  columnCount: number,
) => {
  const endColumn = columnIndexToLetter(columnCount);
  return `${sheetName}!A${rowNumber}:${endColumn}${rowNumber}`;
};

export const getSheetRange = (sheetName: string, columnCount: number) => {
  const endColumn = columnIndexToLetter(columnCount);
  return `${sheetName}!A:${endColumn}`;
};
