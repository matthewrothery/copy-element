/*
  RDS disabled — using SQLite on EC2 instead.
  Re-enable when migrating to PostgreSQL.

resource "random_string" "rds_password" {
  length  = 24
  special = false
}

resource "aws_db_instance" "database" {
  identifier = "${var.project}-${var.environment}-db"

  lifecycle {
    # NOTE: do not use create_before_destroy with deletion_protection=true —
    # Terraform cannot destroy the old instance and will get stuck.
  }

  allocated_storage     = 20
  max_allocated_storage  = 100
  storage_type           = "gp3"
  storage_encrypted       = true

  engine         = var.db_engine_type
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = var.db_user
  password = var.db_password != "" ? var.db_password : random_string.rds_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.allow_postgres.id]
  publicly_accessible    = false

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  performance_insights_enabled = false
  monitoring_interval          = 0

  skip_final_snapshot       = false
  final_snapshot_identifier  = "${var.project}-${var.environment}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  apply_immediately         = true
  deletion_protection        = true

  tags = {
    Name        = "${var.project}-${var.environment}-database"
    Environment = var.environment
    Component   = var.project
  }
}
*/
