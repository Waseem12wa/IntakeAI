
import React, { useState, useRef, useEffect } from 'react';
import { submitConversation } from '../api/api';

const initialQuestions = [
	{
		id: 1,
		text: 'What type of project do you have in mind?',
		options: ['Web App', 'Mobile App', 'AI/NLP', 'Integration', 'Other']
	},
	{
		id: 2,
		text: 'What is your main objective?',
		options: ['Automate process', 'Improve UX', 'Data analysis', 'Other']
	},
	{
		id: 3,
		text: 'Describe your current process.',
		options: ['Manual', 'Partially automated', 'No process', 'Other']
	},
	{
		id: 4,
		text: 'Who are the target users?',
		options: ['Internal staff', 'Customers', 'Partners', 'Other']
	},
	{
		id: 5,
		text: 'Do you need any integrations?',
		options: ['Jira', 'Zodot', 'None', 'Other']
	},
	{
		id: 6,
		text: 'What is your budget?',
		options: ['< $5k', '$5k-$20k', '$20k-$50k', 'Not sure']
	},
	{
		id: 7,
		text: 'What is your deadline?',
		options: ['< 1 month', '1-3 months', '3-6 months', 'Flexible']
	},
	{
		id: 8,
		text: 'Any constraints or additional notes?',
		options: ['No constraints', 'Security', 'Compliance', 'Other']
	},
];

export default function ChatWidget() {
	const [step, setStep] = useState(0);
	const [answers, setAnswers] = useState([]);
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState(null);
	const [error, setError] = useState(null);
	const [customInput, setCustomInput] = useState('');

	const handleOption = async (option) => {
		const newAnswers = [...answers, { question: initialQuestions[step].text, answer: option }];
		setAnswers(newAnswers);
		setCustomInput('');
		if (step < initialQuestions.length - 1) {
			setStep(step + 1);
		} else {
			setSubmitting(true);
			setError(null);
			try {
				const res = await submitConversation(newAnswers);
				setResult(res);
			} catch (err) {
				setError('Submission failed.');
			}
			setSubmitting(false);
		}
	};

	const handleCustom = async () => {
		if (!customInput.trim()) return;
		await handleOption(customInput.trim());
	};

	// Minimalistic design with white background and light blue accents
	return (
		<div style={{
			width: '100%',
			maxWidth: '800px',
			borderRadius: '20px',
			background: '#ffffff',
			border: '1px solid #e5e7eb',
			boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
			padding: '40px',
			color: '#000000',
			fontFamily: "'Google Sans', 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
			position: 'relative',
			overflow: 'hidden'
		}}>
			{/* Chat Header */}
			<div style={{
				textAlign: 'center',
				marginBottom: '40px',
				paddingBottom: '24px',
				borderBottom: '1px solid #f3f4f6'
			}}>
				<div style={{
					width: '60px',
					height: '60px',
					background: '#e6f3ff',
					borderRadius: '50%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					margin: '0 auto 16px auto'
				}}>
					<span style={{ fontSize: '28px' }}>🤖</span>
				</div>
				<h2 style={{
					fontWeight: 700,
					fontSize: '28px',
					margin: '0 0 8px 0',
					color: '#000000'
				}}>
					IntakeAI Assistant
				</h2>
				<div style={{ 
					fontSize: '16px', 
					color: '#666666',
					fontWeight: 500
				}}>
					Your AI-powered project intake assistant
				</div>
			</div>

			{/* Chat Messages Container */}
			<div style={{ 
				background: '#f8f9fa', 
				borderRadius: '16px', 
				padding: '32px', 
				minHeight: '400px', 
				marginBottom: '32px',
				border: '1px solid #e5e7eb'
			}}>
				{/* Previous Answers */}
				{answers.map((a, i) => (
					<div key={i} style={{ marginBottom: '24px' }}>
						{/* Question */}
						<div style={{ marginBottom: '12px' }}>
							<div style={{ 
								display: 'flex', 
								alignItems: 'flex-start', 
								gap: '12px' 
							}}>
								<div style={{
									width: '32px',
									height: '32px',
									background: '#667eea',
									borderRadius: '50%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0
								}}>
									<span style={{ fontSize: '16px', color: '#ffffff' }}>🤖</span>
								</div>
								<div style={{ 
									background: '#ffffff', 
									color: '#000000', 
									borderRadius: '12px', 
									padding: '12px 16px', 
									fontWeight: 500,
									border: '1px solid #e5e7eb',
									maxWidth: '80%'
								}}>
									{a.question}
								</div>
							</div>
						</div>
						{/* Answer */}
						<div style={{ 
							display: 'flex', 
							justifyContent: 'flex-end', 
							marginTop: '8px' 
						}}>
							<div style={{ 
								background: '#667eea', 
								color: '#ffffff', 
								borderRadius: '12px', 
								padding: '12px 16px', 
								fontWeight: 500,
								maxWidth: '80%'
							}}>
								{a.answer}
							</div>
						</div>
					</div>
				))}

				{/* Current Question */}
				{!result && (
					<div style={{ marginTop: answers.length ? '24px' : '0' }}>
						<div style={{ marginBottom: '20px' }}>
							<div style={{ 
								display: 'flex', 
								alignItems: 'flex-start', 
								gap: '12px' 
							}}>
								<div style={{
									width: '32px',
									height: '32px',
									background: '#667eea',
									borderRadius: '50%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0
								}}>
									<span style={{ fontSize: '16px', color: '#ffffff' }}>🤖</span>
								</div>
								<div style={{ 
									background: '#ffffff', 
									color: '#000000', 
									borderRadius: '12px', 
									padding: '12px 16px', 
									fontWeight: 500,
									border: '1px solid #e5e7eb',
									maxWidth: '80%'
								}}>
									{initialQuestions[step].text}
								</div>
							</div>
						</div>

						{/* Answer Options */}
						<div style={{ 
							display: 'flex', 
							flexWrap: 'wrap', 
							gap: '12px',
							marginBottom: '20px'
						}}>
							{initialQuestions[step].options.map(option => (
								<button
									key={option}
									onClick={() => handleOption(option)}
									style={{
										background: '#ffffff',
										color: '#667eea',
										border: '2px solid #667eea',
										borderRadius: '12px',
										padding: '12px 20px',
										fontWeight: 600,
										fontSize: '14px',
										cursor: 'pointer',
										transition: 'all 0.2s ease',
										boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
									}}
									disabled={submitting}
									onMouseEnter={(e) => {
										e.target.style.background = '#667eea';
										e.target.style.color = '#ffffff';
									}}
									onMouseLeave={(e) => {
										e.target.style.background = '#ffffff';
										e.target.style.color = '#667eea';
									}}
								>
									{option}
								</button>
							))}
						</div>

						{/* Custom Input */}
						<div style={{ 
							display: 'flex', 
							gap: '12px',
							alignItems: 'center'
						}}>
							<input
								type="text"
								placeholder="Or type your own answer..."
								value={customInput}
								onChange={e => setCustomInput(e.target.value)}
								onKeyDown={e => e.key === 'Enter' && handleCustom()}
								style={{
									flex: '1',
									borderRadius: '12px',
									border: '2px solid #e5e7eb',
									padding: '12px 16px',
									fontSize: '14px',
									outline: 'none',
									transition: 'border-color 0.2s ease'
								}}
								disabled={submitting}
								onFocus={(e) => {
									e.target.style.borderColor = '#667eea';
								}}
								onBlur={(e) => {
									e.target.style.borderColor = '#e5e7eb';
								}}
							/>
							<button
								onClick={handleCustom}
								style={{
									background: '#667eea',
									color: '#ffffff',
									border: 'none',
									borderRadius: '12px',
									padding: '12px 20px',
									fontWeight: 600,
									fontSize: '14px',
									cursor: 'pointer',
									transition: 'background-color 0.2s ease',
									boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
								}}
								disabled={submitting || !customInput.trim()}
								onMouseEnter={(e) => {
									if (!submitting && customInput.trim()) {
										e.target.style.background = '#5a67d8';
									}
								}}
								onMouseLeave={(e) => {
									if (!submitting && customInput.trim()) {
										e.target.style.background = '#667eea';
									}
								}}
							>
								Send
							</button>
						</div>
					</div>
				)}

				{/* Results */}
				{result && (
					<div style={{ marginTop: '24px' }}>
						<div style={{ 
							display: 'flex', 
							alignItems: 'flex-start', 
							gap: '12px',
							marginBottom: '16px'
						}}>
							<div style={{
								width: '32px',
								height: '32px',
								background: '#10b981',
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexShrink: 0
							}}>
								<span style={{ fontSize: '16px', color: '#ffffff' }}>✅</span>
							</div>
							<div style={{ 
								background: '#ffffff', 
								color: '#000000', 
								borderRadius: '12px', 
								padding: '12px 16px', 
								fontWeight: 500,
								border: '1px solid #e5e7eb',
								maxWidth: '80%'
							}}>
								Thank you! Here's your project summary:
							</div>
						</div>
						<div style={{ 
							background: '#ffffff', 
							color: '#000000', 
							padding: '20px', 
							borderRadius: '12px', 
							fontSize: '14px', 
							border: '1px solid #e5e7eb',
							whiteSpace: 'pre-wrap',
							lineHeight: '1.6'
						}}>
							{result.documents?.markdown || JSON.stringify(result.extractedFields, null, 2)}
						</div>
					</div>
				)}

				{/* Loading and Error States */}
				{submitting && (
					<div style={{ 
						display: 'flex', 
						alignItems: 'center', 
						gap: '12px',
						marginTop: '16px',
						color: '#667eea',
						fontWeight: 500
					}}>
						<div style={{
							width: '20px',
							height: '20px',
							border: '2px solid #e5e7eb',
							borderTop: '2px solid #667eea',
							borderRadius: '50%',
							animation: 'spin 1s linear infinite'
						}}></div>
						Processing your responses...
					</div>
				)}
				
				{error && (
					<div style={{ 
						color: '#dc2626', 
						marginTop: '16px',
						padding: '12px 16px',
						background: '#fef2f2',
						borderRadius: '8px',
						border: '1px solid #fecaca',
						fontWeight: 500
					}}>
						{error}
					</div>
				)}
			</div>

			{/* Progress Indicator */}
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				gap: '8px'
			}}>
				<span style={{ fontSize: '14px', color: '#666666' }}>
					Step {step + 1} of {initialQuestions.length}
				</span>
				<div style={{
					width: '100px',
					height: '4px',
					background: '#e5e7eb',
					borderRadius: '2px',
					overflow: 'hidden'
				}}>
					<div style={{
						width: `${((step + 1) / initialQuestions.length) * 100}%`,
						height: '100%',
						background: '#667eea',
						transition: 'width 0.3s ease'
					}}></div>
				</div>
			</div>

			{/* CSS for spinner animation */}
			<style>{`
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			`}</style>
		</div>
	);
}
