from django.urls import path

from .views import (
    PredictionRequestView,
    PredictionResultView,
    StressTestScenariosView,
    StressTestRunView,
    PersonaListView,
    PersonaAdviceView,
    TimeMachineMomentsView,
    TimeMachineSimulateView,
)

urlpatterns = [
    path("request", PredictionRequestView.as_view(), name="prediction-request"),
    path("stress-test/scenarios", StressTestScenariosView.as_view(), name="stress-test-scenarios"),
    path("stress-test/run", StressTestRunView.as_view(), name="stress-test-run"),
    path("persona/list", PersonaListView.as_view(), name="persona-list"),
    path("persona/ask", PersonaAdviceView.as_view(), name="persona-ask"),
    path("time-machine/moments", TimeMachineMomentsView.as_view(), name="time-machine-moments"),
    path("time-machine/simulate", TimeMachineSimulateView.as_view(), name="time-machine-simulate"),
    path("<uuid:task_id>", PredictionResultView.as_view(), name="prediction-result"),
]
