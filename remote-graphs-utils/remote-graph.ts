export class RemoteGraph<T, U> {
  url: string;
  graphName: string;

  constructor({ graphName, url }) {
    this.graphName = graphName;
    this.url = url;
  }

  invoke = async (params: T) => {
    const response = await fetch(`${this.url}/invoke?graphName=${this.graphName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Error invoking remote graph "${this.graphName}": ${response.status}`);
    }

    return response.json();
  };
}
