import React from "react";
import EnterprisePdfDossier from "./EnterprisePdfDossier";

export default function PdfViewer({ lead, onClose }) {
  return <EnterprisePdfDossier lead={lead} onClose={onClose} />;
}
