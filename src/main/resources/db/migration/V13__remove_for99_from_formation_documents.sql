-- V13: Eliminar hojas oficiales FOR 99 que fueron vinculadas erróneamente a la documentación pública de las formaciones
DELETE FROM formation_documents 
WHERE LOWER(document_url) LIKE '%for_99%' 
   OR LOWER(document_url) LIKE '%for99%' 
   OR LOWER(document_url) LIKE '%for 99%'
   OR LOWER(document_url) LIKE '%official_sheet%';
