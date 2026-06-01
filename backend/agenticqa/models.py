from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class StageName(str, Enum):
    REQUIREMENTS = "requirements"
    SYNTHESIS = "synthesis"
    BDD = "bdd"
    PLAYWRIGHT = "playwright"
    REGRESSION = "regression"  # Dynamic Test Selection — picks impacted subset
    EXECUTION = "execution"
    TRIAGE = "triage"
    BUG_FILED = "bug_filed"
    RE_RUN = "re_run"  # After a fix lands, re-runs DTS + execution and reports the loop


STAGE_ORDER: list[StageName] = [
    StageName.REQUIREMENTS,
    StageName.SYNTHESIS,
    StageName.BDD,
    StageName.PLAYWRIGHT,
    StageName.REGRESSION,
    StageName.EXECUTION,
    StageName.TRIAGE,
    StageName.BUG_FILED,
    StageName.RE_RUN,
]


class StageStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    AWAITING_APPROVAL = "awaiting_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    SKIPPED = "skipped"
    ERROR = "error"


class Step(BaseModel):
    keyword: Literal["Given", "When", "Then", "And", "But"]
    text: str


class Scenario(BaseModel):
    name: str
    tags: list[str] = Field(default_factory=list)
    steps: list[Step]
    notes: str = ""


class BddArtifact(BaseModel):
    feature: str
    description: str = ""
    background: list[Step] = Field(default_factory=list)
    scenarios: list[Scenario]


class JiraTicket(BaseModel):
    key: str
    title: str
    type: str = "Story"
    status: str = "In Progress"
    description: str
    acceptance_criteria: list[str] = Field(default_factory=list)
    labels: list[str] = Field(default_factory=list)


class SynthesisArtifact(BaseModel):
    context_markdown: str
    sources: list[str] = Field(default_factory=list)


class TestFile(BaseModel):
    path: str
    language: Literal["typescript", "javascript"] = "typescript"
    content: str


class PlaywrightArtifact(BaseModel):
    test_files: list[TestFile]
    notes: str = ""


class SelectedTest(BaseModel):
    spec: str  # e.g. "tests/e2e/auth/login.spec.ts"
    case: str  # e.g. "happy path redirects to /dashboard within 2s"
    reason: str  # why this test was selected (impact graph rationale)


class RegressionArtifact(BaseModel):
    strategy: Literal["impact-graph", "tags", "full"]
    diff_summary: str  # short prose summary of what the change touches
    touched_files: list[str] = Field(default_factory=list)
    selected: list[SelectedTest] = Field(default_factory=list)
    skipped_count: int = 0
    total_count: int = 0
    estimated_seconds: int = 0
    notes: str = ""


class FailedTest(BaseModel):
    scenario_name: str
    error_message: str
    stack: str = ""


class ExecutionArtifact(BaseModel):
    pipeline_id: str
    status: Literal["success", "failed", "running"]
    url: str
    summary: str
    failed_tests: list[FailedTest] = Field(default_factory=list)


class TriageArtifact(BaseModel):
    severity: Literal["critical", "high", "medium", "low"]
    suggested_priority: Literal["P0", "P1", "P2", "P3"]
    title: str
    summary_markdown: str
    reproduction_steps: list[str]
    expected: str
    actual: str
    related_jira: str = ""


class BugArtifact(BaseModel):
    jira_key: str
    url: str
    title: str
    body_markdown: str


class RerunArtifact(BaseModel):
    fix_commit: str  # short SHA / URL fragment for the fix that was picked up
    fix_summary: str  # one-liner describing what the fix changed
    rerun_pipeline_id: str
    rerun_url: str
    status: Literal["success", "failed", "running"]
    summary: str  # human-readable summary of the re-run
    selected_count: int  # number of impacted tests re-run by DTS
    passed: int
    failed: int
    estimated_seconds: int


class Stage(BaseModel):
    name: StageName
    status: StageStatus = StageStatus.PENDING
    artifact: dict[str, Any] | None = None
    error: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    reviewer_note: str | None = None


class Run(BaseModel):
    id: str
    jira_ticket: str
    title: str
    created_at: datetime
    updated_at: datetime
    stages: list[Stage]
    current_stage: StageName

    def get_stage(self, name: StageName) -> Stage:
        for s in self.stages:
            if s.name == name:
                return s
        raise KeyError(name)


class RunSummary(BaseModel):
    id: str
    jira_ticket: str
    title: str
    current_stage: StageName
    current_status: StageStatus
    updated_at: datetime


class CreateRunRequest(BaseModel):
    jira_ticket: str


class ApproveRequest(BaseModel):
    note: str | None = None
    edited_artifact: dict[str, Any] | None = None


class RejectRequest(BaseModel):
    note: str
