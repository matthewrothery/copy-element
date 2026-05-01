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

resource "aws_ecr_repository" "mcp" {
  name                 = var.ecr_mcp_repo
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name        = "${var.project}-${var.environment}-mcp"
    Environment = var.environment
  }
}

resource "aws_ecr_repository" "auto_blogger" {
  name                 = var.ecr_auto_blogger_repo
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name        = "${var.project}-${var.environment}-auto-blogger"
    Environment = var.environment
  }
}
