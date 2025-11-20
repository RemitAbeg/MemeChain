import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ContractErrorAlertProps {
	error: any;
	context?: { minStake?: string; userBalance?: string; maxSubmissions?: number };
	className?: string;
}

export default function ContractErrorAlert({ error, context, className }: ContractErrorAlertProps) {
	if (!error) return null;

	// Use the mapping utility to get the user-friendly content
	const { title, description } = errorMessage(error, context);

	return (
		<Alert variant="destructive" className={className}>
			<AlertTriangle />
			<AlertTitle>{title}</AlertTitle>
			<AlertDescription>{description}</AlertDescription>
		</Alert>
	);
}

/**
 * Maps a raw contract revert reason to a user-friendly title and description.
 * @param error A potential error object (e.g., from a wagmi hook).
 * @param context Optional dynamic data (minStake, userBalance, etc.) for interpolation.
 * @returns { title: string, description: string }
 */

export function errorMessage(
	error: any,
	context?: { minStake?: string; userBalance?: string; maxSubmissions?: number }
) {
	// Fallback for non-wagmi or non-string errors
	const rawMessage = error?.message?.toLowerCase() || "An unknown error occurred.";

	// 1. Check for common revert strings
	if (rawMessage.includes("submissions closed")) {
		return {
			title: "Submission Failed",
			description: "The submission window for this meme battle has closed. Please wait for the next battle!",
		};
	}

	if (rawMessage.includes("voting closed")) {
		return {
			title: "Voting Failed",
			description: "Voting is no longer open for this battle. Check the results soon!",
		};
	}

	if (rawMessage.includes("below min stake") && context?.minStake) {
		return {
			title: "Insufficient Vote Amount",
			description: `Your vote is below the minimum required stake. You need to stake at least ${context.minStake} to submit your vote.`,
		};
	}

	if (rawMessage.includes("insufficient balance") && context?.userBalance) {
		return {
			title: "Transaction Blocked",
			description: `Insufficient token balance to complete this action. Your current balance is ${context.userBalance}.`,
		};
	}

	if (rawMessage.includes("user submissions limit") && context?.maxSubmissions !== undefined) {
		return {
			title: "Submission Limit Reached",
			description: `You have reached the maximum limit of ${context.maxSubmissions} submissions allowed for this battle.`,
		};
	}

	// 2. Fallback for general transaction reverts
	if (rawMessage.includes("transaction failed") || rawMessage.includes("revert")) {
		return {
			title: "Transaction Reverted",
			description:
				"The blockchain transaction failed. This is usually due to a contract error. Please check gas limits or try again.",
		};
	}

	// 3. Final generic fallback
	return {
		title: "An Unexpected Error Occurred",
		description: `Details: ${error?.shortMessage || error?.message || "Check the console for more details."}`,
	};
}
