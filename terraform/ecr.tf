resource "aws_ecr_repository" "server" {
  name                 = var.ecr_server_repo
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name        = "${var.project}-${var.environment}-server"
    Environment = var.environment
  }
}
