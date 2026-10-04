import json
from django.core.management.base import BaseCommand
from rag.eval import evaluate_retrieval
from rag.indexer import sync_index


class Command(BaseCommand):
    help = "Runs offline benchmark evaluation for RAG retrieval"

    def handle(self, *args, **options):
        sync_index()
        self.stdout.write("Running RAG Retrieval Evaluation Benchmark...")
        res = evaluate_retrieval()
        self.stdout.write(json.dumps(res, indent=2))
        self.stdout.write(self.style.SUCCESS("RAG Evaluation Complete!"))
