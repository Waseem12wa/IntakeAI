const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
	conversation: { type: Array, required: true }, // Array of Q&A or message objects
	extractedFields: { type: Object }, // Structured fields from AI/NLP
	documents: {
		markdown: { type: String },
		json: { type: Object },
		pdfUrl: { type: String },
	},
	integration: {
		jira: { type: Object },
		zodot: { type: Object },
	},
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

SubmissionSchema.pre('save', function(next) {
	this.updatedAt = Date.now();
	next();
});

module.exports = mongoose.model('Submission', SubmissionSchema);
