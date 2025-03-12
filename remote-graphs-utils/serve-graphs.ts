import express from 'express';

export function serveGraphs() {
    const manifest = require(`${process.cwd()}/manifest.json`);

    if (!manifest.graphs) {
        throw new Error("graph manifest must contain a 'graphs' property");
    }

    const app = express();
    app.use(express.json());

    const graphImplByName = new Map(
        Object.entries(manifest.graphs).map(([graphName, graphFile]) => {
            const graphImpl = require(`${process.cwd()}/${graphFile}`);

            if (!graphImpl?.default?.invoke) {
                throw new Error(`Graph file ${graphFile} must export a default object with an 'invoke' method for invoking the graph`);
            }

            return [graphName, graphImpl?.default];
        })
    );

    app.post(`/invoke`, async (req, res) => {
        try {
            const { graphName } = req.query;

            if (!graphName) {
                res.status(400).json({ error: 'graphName must be provided' });
                return;
            }

            const graphImpl = await graphImplByName.get(graphName.toString());

            if (!graphImpl) {
                res.status(404).json({ error: `graphName wasn't found` });
                return;
            }

            const result = await graphImpl.invoke(req.body);

            res.json(result);
        } catch (error) {
            console.error('Error processing request:', error);
            res.status(500).json({ error: 'An error occurred while processing your request' });
        }
    });

    const PORT = process.env.PORT ?? manifest.port ?? 3000;

    // Start the server
    app.listen(PORT, () => {
        console.log(`Running on port ${PORT}`);
    });
}
