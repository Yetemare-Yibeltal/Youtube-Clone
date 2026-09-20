export const buildUpdate = (changes, columnMap) => {
  const sets = [];
  const values = [];

  for (const [key, column] of Object.entries(columnMap)) {
    if (changes[key] !== undefined) {
      values.push(changes[key]);
      sets.push(`${column} = $${values.length}`);
    }
  }

  return { sets, values };
};
