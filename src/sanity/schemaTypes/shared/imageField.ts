import { defineField } from 'sanity';

export function imageField(name: string, title: string, group?: string) {
  return defineField({
    name,
    title,
    type: 'image',
    group,
    options: { hotspot: true },
    fields: [
      defineField({
        name: 'alt',
        type: 'string',
        title: 'Alternative text',
        validation: (rule) => rule.required().warning('Alt text improves accessibility'),
      }),
    ],
  });
}
