terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "corridor_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "corridor-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "corridor_igw" {
  vpc_id = aws_vpc.corridor_vpc.id

  tags = {
    Name = "corridor-igw"
  }
}

# Subnets
resource "aws_subnet" "corridor_public_subnet" {
  count             = 2
  vpc_id            = aws_vpc.corridor_vpc.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "corridor-public-subnet-${count.index + 1}"
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "corridor_db_subnet_group" {
  name       = "corridor-db-subnet-group"
  subnet_ids = aws_subnet.corridor_public_subnet[*].id

  tags = {
    Name = "corridor-db-subnet-group"
  }
}

# Security Groups
resource "aws_security_group" "corridor_rds_sg" {
  name_prefix = "corridor-rds-"
  vpc_id      = aws_vpc.corridor_vpc.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.corridor_vpc.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "corridor-rds-sg"
  }
}

# RDS Instance
resource "aws_db_instance" "corridor_db" {
  identifier = "corridor-db"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "corridor"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.corridor_rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.corridor_db_subnet_group.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = false
  final_snapshot_identifier = "corridor-db-final-snapshot"

  tags = {
    Name = "corridor-db"
  }
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "corridor_redis_subnet_group" {
  name       = "corridor-redis-subnet-group"
  subnet_ids = aws_subnet.corridor_public_subnet[*].id
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "corridor_redis" {
  cluster_id           = "corridor-redis"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.corridor_redis_subnet_group.name
  security_group_ids   = [aws_security_group.corridor_redis_sg.id]

  tags = {
    Name = "corridor-redis"
  }
}

resource "aws_security_group" "corridor_redis_sg" {
  name_prefix = "corridor-redis-"
  vpc_id      = aws_vpc.corridor_vpc.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.corridor_vpc.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "corridor-redis-sg"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}