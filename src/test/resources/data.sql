-- Initial Companies
INSERT INTO companies(id, name, description) SELECT 1, 'BA Glass Spain SAU', 'Empresa principal de fabricación de vidrio' WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = 1);
INSERT INTO companies(id, name, description) SELECT 2, 'OT Noriega', 'Operador de transporte y logística' WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = 2);
INSERT INTO companies(id, name, description) SELECT 3, 'Eurotalia Transportes e Logística LDA.', 'Transporte internacional y logística' WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = 3);
INSERT INTO companies(id, name, description) SELECT 4, 'Otros', 'Otras empresas y colaboradores externos' WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = 4);

-- One admin user, named admin1 with password 4dm1n and authority admin
INSERT INTO authorities(id,authority) SELECT 1,'ADMIN' WHERE NOT EXISTS (SELECT 1 FROM authorities WHERE id = 1);
INSERT INTO authorities(id,authority) SELECT 2,'USER' WHERE NOT EXISTS (SELECT 1 FROM authorities WHERE id = 2);
INSERT INTO appusers(id,username,email,password,authority,personal_code,first_name,last_name,is_working,is_approved,failed_login_attempts,email_notifications_enabled,push_notifications_enabled,locator,company_id) SELECT 1,'admin1','admin@smartcheckin.com','$2a$10$nMmTWAhPTqXqLDJTag3prumFrAJpsYtroxf0ojesFYq0k4PmcbWUS',1,'0001','ADMIN','SISTEMA',false,true,0,true,true,'AV',1 WHERE NOT EXISTS (SELECT 1 FROM appusers WHERE id = 1);