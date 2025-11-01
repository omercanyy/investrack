import { parse as papaParse } from 'papaparse';

const parseNumber = (value) => {
  if (typeof value !== 'string') {
    return 0;
  }
  return parseFloat(value.replace(/[\$,]/g, '')) || 0;
};

const parseDate = (value) => {
  if (typeof value !== 'string' || !value) {
    return new Date().toISOString().split('T')[0];
  }
  if (value.includes('/')) {
    const parts = value.split('/');
    if (parts.length === 3) {
      return new Date(parts[2], parts[0] - 1, parts[1])
        .toISOString()
        .split('T')[0];
    }
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0];
};

const parsePositionsCSV = (data) => {
  const positions = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row.length >= 4 && row[1]) {
      positions.push({
        date: parseDate(row[0]),
        ticker: row[1].trim().toUpperCase(),
        fillPrice: parseNumber(row[2]),
        amount: parseNumber(row[3]),
        createdAt: new Date().toISOString(),
      });
    }
  }
  return positions;
};

const parseClosedPositionsCSV = (data) => {
  const closedPositions = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row.length >= 6 && row[1]) {
      closedPositions.push({
        date: parseDate(row[0]),
        ticker: row[1].trim().toUpperCase(),
        fillPrice: parseNumber(row[2]),
        amount: parseNumber(row[3]),
        exitPrice: parseNumber(row[4]),
        exitDate: parseDate(row[5]),
        closedAt: new Date().toISOString(),
      });
    }
  }
  return closedPositions;
};

export const processCSVString = (csvString, parseType) => {
  return new Promise((resolve, reject) => {
    if (!csvString) {
      return reject(new Error('Pasted data is empty.'));
    }

    papaParse(csvString.trim(), {
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (parseType === 'positions') {
            resolve(parsePositionsCSV(results.data));
          } else if (parseType === 'closed_positions') {
            resolve(parseClosedPositionsCSV(results.data));
          } else {
            throw new Error('Invalid parse type');
          }
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};
