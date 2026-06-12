export const getFormattedFormErrors = (errors?: any[]) => {
  return errors?.map((err) => {
    if (typeof err === "string") return { message: err };
    if (err && typeof err === "object" && "message" in err) return err;
    return { message: String(err) };
  });
};
