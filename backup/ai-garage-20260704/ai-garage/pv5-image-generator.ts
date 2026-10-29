export function createImagePrompts(
  vehicle:string,
  concept:string,
  modules:string[]
){

  return {

    exterior:
`
Ultra realistic
${vehicle},
${concept},
Korean lifestyle,
photorealistic
`,

    interior:
`
Interior cutaway
${vehicle},
${modules.join(",")},
photorealistic
`,

    camping:
`
Camping scene,
${vehicle},
awning,
bed,
night lighting,
photorealistic
`
  };
}
