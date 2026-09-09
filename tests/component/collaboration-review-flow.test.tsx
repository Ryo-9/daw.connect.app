import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CollaborationReviewFlow,
  ReviewDecisionSurface,
} from "@/components/collaboration-review-flow";
import { MidiProposalSurface } from "@/components/song-production-surfaces";

describe("CollaborationReviewFlow", () => {
  it("5つのreview stepと各sectionへのリンクを表示する", () => {
    render(<CollaborationReviewFlow version="v0.8" />);

    const navigation = screen.getByRole("navigation", {
      name: "コラボレーションレビューフロー",
    });
    expect(within(navigation).getAllByRole("link")).toHaveLength(5);

    [
      ["01 PREVIEWへ移動", "#preview"],
      ["02 COMMENTへ移動", "#comments"],
      ["03 PROPOSALへ移動", "#proposal"],
      ["04 DECISIONへ移動", "#decision"],
      ["05 VERSIONへ移動", "#version"],
    ].forEach(([name, href]) => {
      expect(within(navigation).getByRole("link", { name })).toHaveAttribute(
        "href",
        href,
      );
    });

    expect(screen.getByText(/Phase 1 prototype/)).toBeInTheDocument();
    expect(screen.getByText("CURRENT v0.8")).toBeInTheDocument();
  });
});

describe("Proposal and decision boundaries", () => {
  it("OriginalとProposalを分離し、判断をmockの無効操作として示す", () => {
    render(
      <>
        <MidiProposalSurface />
        <ReviewDecisionSurface version="v0.8" />
      </>,
    );

    expect(screen.getByLabelText("Original MIDI、読み取り専用")).toHaveTextContent(
      "READ ONLY",
    );
    expect(
      screen.getByLabelText("Originalとは別データのMIDI Proposal"),
    ).toBeInTheDocument();
    expect(screen.getByText(/ORIGINAL MIDI/)).toHaveTextContent(
      "ORIGINAL MIDI ≠ PROPOSAL DATA",
    );

    ["ACCEPT", "PARTIAL", "HOLD", "REJECT"].forEach((label) => {
      expect(screen.getByRole("button", { name: label })).toBeDisabled();
    });
    expect(screen.getByText(/選択・保存・DAWへの自動反映は行いません/)).toBeInTheDocument();
  });
});
