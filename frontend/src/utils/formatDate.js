export const formatDate = (dateInput) => {
  const date = new Date(dateInput);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
