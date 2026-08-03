class NodeRegistry {
    constructor() {
        this.registry = {};
    }

    /**
     * Register a node type definition.
     * @param {string} type 
     * @param {object} definition 
     */
    register(type, definition) {
        this.registry[type] = {
            type,
            ...definition
        };
        console.log(`[NodeRegistry] Registered node type: ${type}`);
    }

    /**
     * Get a node type definition.
     * @param {string} type 
     * @returns {object|null}
     */
    get(type) {
        return this.registry[type] || null;
    }

    /**
     * Get all registered node definitions.
     * @returns {Array}
     */
    getAll() {
        return Object.values(this.registry);
    }
}

export const nodeRegistry = new NodeRegistry();
export default nodeRegistry;
