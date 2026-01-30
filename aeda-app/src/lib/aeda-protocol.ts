// --- 1. FIRESTORE SCHEMA DEFINITIONS ---

export type UserRole = 'Teacher' | 'Student';
export type RecordType = 'CONTENT_UPLOAD' | 'QA_INTERACTION';

export interface IdentityContext {
    user_role: UserRole;
    subject: string;
    topic: string;
}

export interface QAPair {
    q: string;
    a: string; // Should include Latex formatted math if applicable
}

export interface DataPayload {
    summary?: string;       // For CONTENT_UPLOAD
    full_extraction?: string; // For CONTENT_UPLOAD (OCR text)
    qa_pair?: QAPair;       // For QA_INTERACTION
}

export interface AedaFirestoreRecord {
    record_type: RecordType;
    identity_context: IdentityContext;
    data_payload: DataPayload;
    search_tags: string[];
    firestore_ready: boolean;
    timestamp: string; // ISO String
}

// --- 2. PROTOCOL HELPERS ---

/**
 * Simulates the "OCR EXCELLENCE" protocol.
 * In a real app, this would call a Vision API.
 */
export const mockOcrProcess = (fileName: string): string => {
    return `[OCR EXTRACTION FOR ${fileName}]\n\n` +
        `Here is the extracted text content from the document.\n` +
        `It appears to cover foundational concepts in the specified subject.\n\n` +
        `Diagram Description:\n` +
        `- Figure 1: Shows a hierarchical structure of the biological taxonomy.\n` +
        `- Label A points to "Kingdom", Label B points to "Phylum".\n\n` +
        `Key Formulas detected:\n` +
        `$ F = ma $ (Newton's Second Law)\n` +
        `$ E = mc^2 $ (Mass-Energy Equivalence)`;
};

/**
 * Simulates "LOGICAL MAPPING" and Math rendering.
 */
export const formatLatex = (text: string): string => {
    // In a real app, this would parse text and wrap math in safe delimiters.
    // Here we just ensure existing $...$ are preserved or highlighted? 
    // For this demo, we assume the input text already has $...$.
    return text;
};

/**
 * Generates the Strict JSON Block for Firestore.
 */
export const generateFirestorePayload = (
    type: RecordType,
    role: UserRole,
    subject: string,
    topic: string,
    data: DataPayload,
    tags: string[]
): AedaFirestoreRecord => {
    return {
        record_type: type,
        identity_context: {
            user_role: role,
            subject: subject,
            topic: topic,
        },
        data_payload: data,
        search_tags: tags,
        firestore_ready: true,
        timestamp: new Date().toISOString()
    };
};
