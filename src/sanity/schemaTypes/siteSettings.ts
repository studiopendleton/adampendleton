import { CogIcon } from '@sanity/icons';
import { defineArrayMember, defineField, defineType } from 'sanity';
import { imageField } from './shared/imageField';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'appearance', title: 'Appearance' },
    { name: 'migration', title: 'Migration (legacy HTML)' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      initialValue: 'Adam Pendleton',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'mainText',
      title: 'Main Text Blocks',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          name: 'homeTextBlock',
          title: 'Home Text Block',
          type: 'object',
          fields: [
            defineField({
              name: 'content',
              title: 'Content',
              type: 'array',
              of: [defineArrayMember({ type: 'block' })],
            }),
            defineField({
              name: 'html',
              title: 'Imported HTML',
              type: 'text',
              rows: 4,
              description:
                'Legacy Kirby markup. Portable Text content takes precedence when populated. Remove after migration is complete.',
            }),
          ],
          preview: {
            select: { content: 'content', html: 'html' },
            prepare: ({ content, html }) => ({
              title:
                content?.[0]?.children?.map((child: { text?: string }) => child.text).join('') ||
                html?.replace(/<[^>]*>/g, '').slice(0, 80) ||
                'Text block',
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'frameHeight',
      title: 'Minimum Paragraph Frame Height',
      type: 'number',
      group: 'appearance',
      initialValue: 100,
      validation: (rule) => rule.min(50).max(200),
    }),
    defineField({
      name: 'footerText',
      title: 'Footer Text',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'footerHtml',
      title: 'Imported Footer HTML',
      type: 'text',
      group: 'migration',
      rows: 3,
      description:
        'Legacy Kirby footer markup. Portable Text footer content takes precedence when populated. Remove after migration is complete.',
    }),
    imageField('desktopBackgroundImage', 'Desktop Background Image', 'appearance'),
    imageField('mobileBackgroundImage', 'Mobile Background Image', 'appearance'),
    defineField({
      name: 'backgroundPosition',
      title: 'Background Image Position',
      type: 'string',
      group: 'appearance',
      options: { list: ['top', 'center', 'bottom'], layout: 'radio' },
      initialValue: 'top',
    }),
    defineField({
      name: 'bodyTextColor',
      title: 'Body Background Color',
      type: 'string',
      group: 'appearance',
      description: 'Used as the page background behind text blocks (CSS --body-color).',
      initialValue: 'rgb(35, 35, 35)',
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Text & Link Color',
      type: 'string',
      group: 'appearance',
      description:
        'Legacy Kirby field name. Controls body text and link hover color (CSS --background-color).',
      initialValue: '#ffffff',
    }),
    defineField({
      name: 'fontSize',
      title: 'Font Size Desktop',
      type: 'string',
      group: 'appearance',
      options: { list: ['2.5rem', '3rem', '3.5rem', '4rem'] },
      initialValue: '3rem',
    }),
    defineField({
      name: 'mobileFontSize',
      title: 'Font Size Mobile Scale',
      type: 'number',
      group: 'appearance',
      options: { list: [0.25, 0.33, 0.5, 0.66] },
      initialValue: 0.5,
    }),
    defineField({
      name: 'blend',
      title: 'Blend Text',
      type: 'boolean',
      group: 'appearance',
      initialValue: true,
    }),
    defineField({
      name: 'font',
      title: 'Font',
      type: 'string',
      group: 'appearance',
      initialValue: 'UnicaMedium',
    }),
  ],
});
