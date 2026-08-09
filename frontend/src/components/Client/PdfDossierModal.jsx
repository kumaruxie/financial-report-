import React from "react";
import EnterprisePdfDossier from "./EnterprisePdfDossier";

export default function PdfDossierModal({ lead, onClose }) {
  return <EnterprisePdfDossier lead={lead} onClose={onClose} />;
}
