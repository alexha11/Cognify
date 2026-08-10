"use client";

import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Modal } from "./modal";
import { Trophy } from "lucide-react";

interface GuestNameModalProps {
  isOpen: boolean;
  onSubmit: (name: string) => void;
  onSkip: () => void;
  score: number;
  total: number;
}

const MAX_NAME_LENGTH = 30;

export function GuestNameModal({
  isOpen,
  onSubmit,
  onSkip,
  score,
  total,
}: GuestNameModalProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name.trim() || "Anonymous");
  };

  return (
    <Modal
      open={isOpen}
      onClose={onSkip}
      size="sm"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onSkip}>
            Skip
          </Button>
          <Button type="submit" form="guest-name-form">
            Save to leaderboard
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-subtle text-primary">
          <Trophy className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Save your score
          </h2>
          <p className="text-sm text-muted-foreground">
            You scored{" "}
            <span className="font-semibold text-foreground">
              {score}/{total}
            </span>{" "}
            — enter your name to appear on the leaderboard.
          </p>
        </div>
      </div>

      <form id="guest-name-form" onSubmit={handleSubmit} className="mt-5">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="guest-name">Nickname</Label>
            <span className="text-xs text-muted-foreground tabular-nums">
              {name.length}/{MAX_NAME_LENGTH}
            </span>
          </div>
          <Input
            id="guest-name"
            value={name}
            onChange={(e) =>
              setName(e.target.value.slice(0, MAX_NAME_LENGTH))}
            placeholder="Your nickname"
            autoFocus
          />
        </div>
      </form>
    </Modal>
  );
}
