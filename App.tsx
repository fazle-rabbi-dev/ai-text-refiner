import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Task, Tone } from "./types";
import { refineText, convertBanglishToEnglish } from "./services/geminiService";
import SparklesIcon from "./components/icons/SparklesIcon";
import CopyIcon from "./components/icons/CopyIcon";
import LoadingSpinner from "./components/icons/LoadingSpinner";

const taskOptions = Object.values(Task);
const predefinedTones = Object.values(Tone);
const CUSTOM_TONES_STORAGE_KEY = "ai-text-refiner-custom-tones";

const taskToLanguageMap: { [key in Task]?: string } = {
	[Task.REFINE_ENGLISH]: "English",
	[Task.REFINE_BANGLISH]: "Banglish (Bengali in English letters)",
	[Task.REFINE_BANGLA]: "Bengali (Bangla script)",
};

export const App: React.FC = () => {
	const [inputText, setInputText] = useState<string>("");
	const [selectedTask, setSelectedTask] = useState<Task>(Task.REFINE_ENGLISH);
	const [selectedTone, setSelectedTone] = useState<string>(Tone.PROFESSIONAL);
	const [outputText, setOutputText] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [apiError, setApiError] = useState<string | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [isCopied, setIsCopied] = useState<boolean>(false);
	const [customTones, setCustomTones] = useState<string[]>([]);
	const [customToneInput, setCustomToneInput] = useState("");

	// Load custom tones from localStorage on initial render
	useEffect(() => {
		try {
			const storedTones = localStorage.getItem(CUSTOM_TONES_STORAGE_KEY);
			if (storedTones) {
				setCustomTones(JSON.parse(storedTones));
			}
		} catch (e) {
			console.error("Failed to parse custom tones from localStorage", e);
			setFormError("Could not load custom tones.");
		}
	}, []);

	// Save custom tones to localStorage whenever they change
	useEffect(() => {
		try {
			localStorage.setItem(CUSTOM_TONES_STORAGE_KEY, JSON.stringify(customTones));
		} catch (e) {
			console.error("Failed to save custom tones to localStorage", e);
			setFormError("Could not save custom tones.");
		}
	}, [customTones]);

	const allTones = useMemo(() => [...predefinedTones, ...customTones], [customTones]);

	const handleRefine = useCallback(async () => {
		if (!inputText.trim()) {
			setApiError("Please enter some text to process.");
			setOutputText("");
			return;
		}

		setIsLoading(true);
		setApiError(null);
		setOutputText("");
		setIsCopied(false);

		let result: string;

		if (selectedTask === Task.BANGLISH_TO_ENGLISH) {
			result = await convertBanglishToEnglish(inputText, selectedTone);
		} else {
			const language = taskToLanguageMap[selectedTask];
			if (!language) {
				setApiError(`Error: Task '${selectedTask}' is not configured correctly.`);
				setIsLoading(false);
				return;
			}
			result = await refineText(inputText, language, selectedTone);
		}

		if (result.startsWith("Error:")) {
			setApiError(result);
		} else {
			setOutputText(result);
		}

		setIsLoading(false);
	}, [inputText, selectedTask, selectedTone]);

	const handleCopy = () => {
		if (outputText) {
			navigator.clipboard.writeText(outputText);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		}
	};

	const handleAddCustomTone = () => {
		const newTone = customToneInput.trim();
		if (!newTone) {
			setFormError("Custom tone cannot be empty.");
			return;
		}
		if (allTones.some((t) => t.toLowerCase() === newTone.toLowerCase())) {
			setFormError("This tone already exists.");
			return;
		}
		setCustomTones((prev) => [...prev, newTone]);
		setCustomToneInput("");
		setFormError(null);
	};

	const handleRemoveCustomTone = (toneToRemove: string) => {
		setCustomTones((prev) => prev.filter((t) => t !== toneToRemove));
		if (selectedTone === toneToRemove) {
			setSelectedTone(Tone.PROFESSIONAL);
		}
	};

	return (
		<div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
			<header className="w-full max-w-4xl text-center mb-8">
				<h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
					AI Text Refiner
				</h1>
				<p className="text-slate-400 mt-2">
					Instantly rewrite and translate your text into different styles.
				</p>
			</header>

			<main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Input & Controls Column */}
				<div className="flex flex-col gap-6">
					<div className="bg-slate-800/50 rounded-xl shadow-lg border border-slate-700 p-6">
						<h2 className="text-lg font-semibold text-slate-300 mb-3">Select Task</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{taskOptions.map((task) => (
								<button
									key={task}
									onClick={() => setSelectedTask(task)}
									className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 text-center ${
										selectedTask === task
											? "bg-indigo-600 text-white shadow-md"
											: "bg-slate-700 hover:bg-slate-600 text-slate-300"
									}`}>
									{task}
								</button>
							))}
						</div>
					</div>

					<div className="bg-slate-800/50 rounded-xl shadow-lg border border-slate-700 p-6">
						<label
							htmlFor="inputText"
							className="text-lg font-semibold text-slate-300 mb-3 block">
							Your Text
						</label>
						<textarea
							id="inputText"
							value={inputText}
							onChange={(e) => setInputText(e.target.value)}
							placeholder="Enter your text here..."
							className="w-full h-48 bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none"
						/>
					</div>

					<div className="bg-slate-800/50 rounded-xl shadow-lg border border-slate-700 p-6">
						<h2 className="text-lg font-semibold text-slate-300 mb-3">Choose a Tone</h2>
						<div className="flex gap-2 mb-3">
							<input
								type="text"
								value={customToneInput}
								onChange={(e) => {
									setCustomToneInput(e.target.value);
									if (formError) setFormError(null);
								}}
								onKeyDown={(e) => e.key === "Enter" && handleAddCustomTone()}
								placeholder="Add a custom tone..."
								className="flex-grow bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
							/>
							<button
								onClick={handleAddCustomTone}
								className="bg-indigo-600 text-white font-semibold px-4 text-sm rounded-lg hover:bg-indigo-700 transition-colors duration-200 shrink-0">
								Add
							</button>
						</div>
						{formError && <p className="text-red-400 text-xs mb-3">{formError}</p>}
						<div className="grid grid-cols-2 gap-3">
							{allTones.map((tone) => {
								const isCustom = !predefinedTones.includes(tone as Tone);
								return (
									<div
										key={tone}
										className="relative">
										<button
											onClick={() => setSelectedTone(tone)}
											className={`p-3 w-full text-center font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
												selectedTone === tone
													? "bg-indigo-600 text-white shadow-lg"
													: "bg-slate-700 hover:bg-slate-600 text-slate-300"
											} ${isCustom ? "pr-8" : ""}`}>
											<span className="truncate">{tone}</span>
										</button>
										{isCustom && (
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleRemoveCustomTone(tone);
												}}
												className="absolute top-0 right-0 h-full px-2 flex items-center text-slate-400 hover:text-white"
												aria-label={`Remove ${tone} tone`}>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-4 w-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													strokeWidth="2">
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
											</button>
										)}
									</div>
								);
							})}
						</div>
					</div>

					<button
						onClick={handleRefine}
						disabled={isLoading}
						className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
						{isLoading ? (
							<LoadingSpinner className="w-5 h-5" />
						) : (
							<SparklesIcon className="w-5 h-5" />
						)}
						<span>{isLoading ? "Processing..." : "Process Text"}</span>
					</button>
				</div>

				{/* Output Column */}
				<div className="bg-slate-800/50 rounded-xl shadow-lg border border-slate-700 p-6 relative min-h-[300px] lg:min-h-full flex flex-col">
					<div className="flex justify-between items-center mb-3">
						<h2 className="text-lg font-semibold text-slate-300">Output</h2>
						{outputText && !isLoading && (
							<button
								onClick={handleCopy}
								className="flex items-center gap-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-md transition-colors duration-200">
								<CopyIcon
									copied={isCopied}
									className="w-4 h-4"
								/>
								{isCopied ? "Copied!" : "Copy"}
							</button>
						)}
					</div>

					<div className="w-full h-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-200 flex-grow whitespace-pre-wrap overflow-y-auto">
						{isLoading && (
							<div className="flex items-center justify-center h-full text-slate-400">
								<LoadingSpinner className="w-8 h-8" />
							</div>
						)}
						{apiError && <p className="text-red-400">{apiError}</p>}
						{!isLoading && !apiError && !outputText && (
							<div className="flex items-center justify-center h-full text-slate-500">
								Your result will appear here.
							</div>
						)}
						<p>{outputText}</p>
					</div>
				</div>
			</main>

			<footer className="w-full max-w-4xl text-center mt-12 text-slate-500 text-sm">
				<p>Powered by Google Gemini. Built with React & Tailwind CSS.</p>
			</footer>
		</div>
	);
};

export default App;
