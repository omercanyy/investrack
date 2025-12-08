import { parse as papaParse } from 'papaparse';

const parseNumber = (value) => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value !== 'string') {
    return 0;
  }
  return parseFloat(value.replace(/[\$,]/g, '')) || 0;
};

const parseDate = (value) => {
  if (typeof value !== 'string' || !value) {
    return null;
  }
  if (value.includes('/')) {
    const parts = value.split('/');
    if (parts.length === 3) {
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return new Date(year, parts[0] - 1, parts[1])
        .toISOString()
        .split('T')[0];
    }
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().split('T')[0];
};

const toTitleCase = (str) => {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

const parsePositionsCSV = (data) => {
  const positions = [];
  const strategies = [];
  for (const row of data) {
    if (row && row['Asset']) {
      const ticker = row['Asset'].trim().toUpperCase();
      positions.push({
        date: parseDate(row['Entry Date']),
        ticker: ticker,
        fillPrice: parseNumber(row['Entry']),
        amount: parseNumber(row['Quantity']),
        account: row['Account'] ? toTitleCase(row['Account'].trim()) : '',
        createdAt: new Date().toISOString(),
      });
      if (row['Strategy']) {
        strategies.push({
          ticker: ticker,
          strategy: row['Strategy'].trim(),
        });
      }
    }
  }
  return { positions, strategies };
};

const parseClosedPositionsCSV = (data) => {
  const closedPositions = [];
  const strategies = [];
  for (const row of data) {
    if (row && row['Asset']) {
      const ticker = row['Asset'].trim().toUpperCase();
      closedPositions.push({
        date: parseDate(row['Entry Date']),
        amount: parseNumber(row['Quantity']),
        fillPrice: parseNumber(row['Entry']),
        ticker: ticker,
        exitPrice: parseNumber(row['Exit']),
        exitDate: parseDate(row['Exit Date']),
        account: row['Account'] ? toTitleCase(row['Account'].trim()) : null,
        closedAt: new Date().toISOString(),
      });
      if (row['Strategy']) {
        strategies.push({
          ticker: ticker,
          strategy: row['Strategy'].trim(),
        });
      }
    }
  }
  return { positions: closedPositions, strategies };
};

export const processTSVString = (tsvString, parseType) => {
  return new Promise((resolve, reject) => {
    if (!tsvString) {
      return reject(new Error('Pasted data is empty.'));
    }

    papaParse(tsvString.trim(), {
      skipEmptyLines: true,
      header: true,
      delimiter: '\t',
      transformHeader: h => h.trim(),
      complete: (results) => {
        try {
          if (results.errors.length) {
            console.error("TSV parsing errors:", results.errors);
          }

          if (parseType === 'positions') {
            resolve(parsePositionsCSV(results.data));
          } else if (parseType === 'closed_positions') {
            const parsedData = parseClosedPositionsCSV(results.data);
            resolve(parsedData);
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
