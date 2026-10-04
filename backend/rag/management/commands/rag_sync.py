from django.core.management.base import BaseCommand
from rag.indexer import sync_index


class Command(BaseCommand):
    help = "Syncs and builds the RAG document index"

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Force re-embedding of all document chunks")

    def handle(self, *args, **options):
        self.stdout.write("Syncing RAG Knowledge Index...")
        count = sync_index(force=options.get("force", False))
        self.stdout.write(self.style.SUCCESS(f"Successfully indexed {count} document chunks."))
