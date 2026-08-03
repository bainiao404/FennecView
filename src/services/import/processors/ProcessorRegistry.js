import { SpineProcessor } from './SpineProcessor'
import { Live2dProcessor } from './Live2dProcessor'
import { SpritesheetProcessor } from './SpritesheetProcessor'
import { MediaProcessor } from './MediaProcessor'

class ProcessorRegistry {
    constructor() {
        this.processors = [];
        
        // Register default processors in order of priority (lower number is higher priority)
        this.register(new Live2dProcessor(), 10, true);
        this.register(new SpineProcessor(), 20, true);
        this.register(new SpritesheetProcessor(), 30, true);
        this.register(new MediaProcessor(), 100, false);
    }

    register(processor, priority = 50, isEntryBased = true) {
        processor.priority = priority;
        processor.isEntryBased = isEntryBased;
        this.processors.push(processor);
        this.processors.sort((a, b) => a.priority - b.priority);
    }

    getProcessors() {
        return this.processors;
    }
}

export const processorRegistry = new ProcessorRegistry();
