declare module 'dompurify' {
  const DOMPurify: {
    sanitize: (dirty: string, options?: unknown) => string;
  };
  export default DOMPurify;
}
