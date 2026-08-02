-- Local-dev databases for Python services in the PoD multi-repo workspace.
CREATE DATABASE IF NOT EXISTS hot_wallet;
CREATE DATABASE IF NOT EXISTS contract_manager;
CREATE DATABASE IF NOT EXISTS test_db;

CREATE USER IF NOT EXISTS 'hotwalletuser'@'%' IDENTIFIED BY 'hotpassword';
CREATE USER IF NOT EXISTS 'cmsuser'@'%' IDENTIFIED BY 'cmspassword';
CREATE USER IF NOT EXISTS 'test_user'@'%' IDENTIFIED BY 'test_password';

GRANT ALL PRIVILEGES ON hot_wallet.* TO 'hotwalletuser'@'%';
GRANT ALL PRIVILEGES ON contract_manager.* TO 'cmsuser'@'%';
GRANT ALL PRIVILEGES ON test_db.* TO 'test_user'@'%';
GRANT ALL PRIVILEGES ON test_db.* TO 'hotwalletuser'@'%';
GRANT ALL PRIVILEGES ON test_db.* TO 'cmsuser'@'%';

FLUSH PRIVILEGES;
